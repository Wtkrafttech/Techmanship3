
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Copy, Check, ShieldCheck, AlertCircle, Loader2, Image as ImageIcon, ShoppingBag, ChevronRight, ChevronDown } from 'lucide-react';
import { useAppContext } from '../AppContext';
import { MOCK_PAYMENT } from '../mockData';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { sendTelegramNotification } from '../lib/notifications';
import { useToast } from '../components/Toast';
import { PaymentSettings } from '../types';

export const Checkout = () => {
  const { cart, cartTotal, clearCart, user, settings } = useAppContext();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const gateways = settings?.gateways || [MOCK_PAYMENT];
  const [selectedGateway, setSelectedGateway] = useState<PaymentSettings>(gateways[0]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (gateways.length > 0) {
      const exists = gateways.find(g => g.walletAddress === selectedGateway?.walletAddress);
      if (!exists) {
        setSelectedGateway(gateways[0]);
      }
    }
  }, [gateways]);

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/templates');
    }
  }, [cart, navigate]);

  const handleCopy = () => {
    if (!selectedGateway) return;
    navigator.clipboard.writeText(selectedGateway.walletAddress);
    setCopied(true);
    showToast('success', 'ADDRESS COPIED TO CLIPBOARD.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaymentSent = async () => {
    if (!user) {
      showToast('warning', 'AUTHENTICATION REQUIRED TO COMPLETE PURCHASE.');
      navigate('/login');
      return;
    }

    if (!selectedGateway) {
      showToast('error', 'PLEASE SELECT A PAYMENT GATEWAY.');
      return;
    }

    setProcessing(true);
    try {
      const orderItems = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        imageUrls: item.imageUrls || [],
        modelUrl: item.modelUrl || '',
        category: item.category || 'General',
        selectedHosting: item.selectedHosting || false,
        selectedDomain: item.selectedDomain || false,
        selectedInbox: item.selectedInbox || false,
        configId: item.configId
      }));

      const orderData = {
        userId: user.uid,
        userEmail: user.email,
        items: orderItems,
        totalPrice: cartTotal,
        status: 'pending', 
        createdAt: serverTimestamp(),
        paymentMethod: 'crypto',
        network: selectedGateway.cryptocurrency,
        walletAddress: selectedGateway.walletAddress
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      const tgConfig = (settings as any).telegram;
      if (tgConfig?.botToken && tgConfig?.chatId) {
        const itemList = cart.map(i => `• ${i.name} (x${i.quantity})`).join('\n');
        const message = [
          `<b>[NEW ASSET ACQUISITION]</b>`,
          `Order ID: <code>${docRef.id}</code>`,
          `User: ${user.displayName}`,
          `Email: ${user.email}`,
          `Total: <b>$${cartTotal.toFixed(2)}</b>`,
          `Currency: ${orderData.network}`,
          `\n<b>Items:</b>\n${itemList}`,
          `\n<i>Status: Pending Confirmation</i>`
        ].join('\n');

        await sendTelegramNotification(tgConfig.botToken, tgConfig.chatId, message);
      }

      showToast('success', 'PAYMENT REGISTERED. AWAITING VERIFICATION.');
      clearCart();
      navigate('/dashboard');
    } catch (err) {
      console.error("Order failed:", err);
      showToast('error', 'ORDER FAILED. PLEASE CONTACT COMMAND SUPPORT.');
    } finally {
      setProcessing(false);
    }
  };

  const getCryptoColor = (crypto: string) => {
    const lower = crypto.toLowerCase();
    if (lower.includes('btc') || lower.includes('bitcoin')) return 'text-[#F7931A]';
    if (lower.includes('eth') || lower.includes('ethereum')) return 'text-[#627EEA]';
    if (lower.includes('sol') || lower.includes('solana')) return 'text-[#14F195]';
    return 'text-emerald-500';
  };

  const getSelectedBg = (crypto: string) => {
    const lower = crypto.toLowerCase();
    if (lower.includes('btc') || lower.includes('bitcoin')) return 'bg-[#F7931A] text-white';
    if (lower.includes('eth') || lower.includes('ethereum')) return 'bg-[#627EEA] text-white';
    if (lower.includes('sol') || lower.includes('solana')) return 'bg-[#14F195] text-black';
    return 'bg-emerald-500 text-black';
  };

  if (!selectedGateway) return null;

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-4">
          <ShoppingBag className="w-3 h-3 text-zinc-500" />
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Secure Checkout Terminal</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-2 uppercase italic">Finalize Transfer</h1>
        <p className="text-muted-foreground uppercase text-[10px] tracking-widest font-bold">Configure your cryptographic payment channel.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Enhanced Dropdown Gateway Selection */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-2">Choose Gateway</h3>
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 text-left overflow-hidden ${
                getSelectedBg(selectedGateway.cryptocurrency)
              } shadow-2xl`}
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-black/20">
                  <ShieldCheck className="w-5 h-5 text-current" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase tracking-widest">{selectedGateway.cryptocurrency}</span>
                  <span className="text-[8px] font-mono opacity-70">
                    {selectedGateway.walletAddress.slice(0, 8)}...{selectedGateway.walletAddress.slice(-6)}
                  </span>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950 border border-white/10 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                {gateways.map((gw, idx) => {
                  const isSelected = selectedGateway.walletAddress === gw.walletAddress;
                  return (
                    <button 
                      key={idx}
                      onClick={() => {
                        setSelectedGateway(gw);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-5 py-4 transition-all hover:bg-white/5 ${
                        isSelected ? 'bg-white/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${getCryptoColor(gw.cryptocurrency).replace('text-', 'bg-')}`} />
                        <div className="flex flex-col">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
                            {gw.cryptocurrency}
                          </span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-5 bg-zinc-900/20 border border-white/5 rounded-[1.5rem] space-y-4 mt-6">
             <div className="flex items-center gap-3">
               <div className="w-1 h-8 bg-zinc-800 rounded-full" />
               <p className="text-[9px] font-black uppercase text-zinc-500 leading-relaxed">
                 Dropdown selection updates the central QR terminal and address registry automatically.
               </p>
             </div>
          </div>
        </div>

        {/* Center: QR & Address */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-white/10 rounded-[2.5rem] p-8 shadow-2xl text-center flex flex-col items-center">
            <h3 className="font-black mb-6 text-xl uppercase italic tracking-tight">QR Entry</h3>
            <div className="bg-white p-5 rounded-[2.5rem] inline-block mb-8 shadow-[0_0_40px_rgba(255,255,255,0.05)] animate-in zoom-in duration-500">
              <img src={selectedGateway.qrCodeUrl} className="w-48 h-48" alt="Payment QR" />
            </div>
            <div className="space-y-5 text-left w-full">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Selected Network</label>
                <div className="p-4 bg-black/40 border border-white/5 rounded-2xl font-mono text-xs text-white ring-1 ring-white/5">
                  {selectedGateway.cryptocurrency}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-1">Wallet Address</label>
                <div className="relative group">
                  <div className="p-4 bg-black/40 border border-white/5 rounded-2xl font-mono text-[10px] break-all pr-12 text-zinc-400 leading-relaxed ring-1 ring-white/5 group-hover:ring-white/10 transition-all">
                    {selectedGateway.walletAddress}
                  </div>
                  <button onClick={handleCopy} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-xl transition-all">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-zinc-400 group-hover:text-white" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <h3 className="font-black mb-8 text-xl uppercase italic tracking-tight">Order Manifest</h3>
            <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
              {cart.map(item => (
                <div key={item.configId} className="flex items-center justify-between text-xs gap-4 border-b border-white/5 pb-4 last:border-0">
                  <div className="flex items-center gap-4 min-w-0">
                    <img src={item.imageUrls?.[0]} alt="" className="w-10 h-10 object-cover rounded-lg border border-white/5" />
                    <div className="min-w-0">
                      <p className="truncate font-black uppercase text-[10px] text-white">{item.name}</p>
                      <p className="text-[8px] text-zinc-500 font-mono">QTY: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-mono text-zinc-400 flex-shrink-0 text-[10px] font-black">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="pt-8 border-t border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Grand Total</span>
                <span className="text-4xl font-mono font-black italic text-green-400">${cartTotal.toFixed(2)}</span>
              </div>
              <button 
                onClick={handlePaymentSent} 
                disabled={processing} 
                className="w-full bg-white text-black py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4 shadow-2xl shadow-green-500/5"
              >
                {processing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> VERIFYING...</>
                ) : (
                  <>CONFIRM PAYMENT <ShieldCheck className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </div>
          
          <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-[2rem] flex gap-4">
            <AlertCircle className="w-6 h-6 text-blue-500 flex-shrink-0" />
            <div className="text-[10px]">
              <h4 className="font-black text-blue-400 mb-1 uppercase tracking-widest">Protocol Sync</h4>
              <p className="text-blue-500/60 font-medium uppercase tracking-tighter leading-relaxed">Orders are confirmed post network validation by System Command.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
