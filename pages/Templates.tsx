
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, Navigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Grid, List as ListIcon, EyeOff, Loader2, ArrowRight, Sparkles, X, Send, Globe, MessageSquare, Lock, Unlock, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, where, orderBy, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { useAppContext } from '../AppContext';
import { Product, Category } from '../types';
import { updatePageTitle } from '../lib/utils';
import { sendTelegramNotification } from '../lib/notifications';
import { useToast } from '../components/Toast';

export const Templates = () => {
  const { user, isInitialLoading, settings } = useAppContext();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState('');
  
  const [isProposalOpen, setIsProposalOpen] = useState(false);
  const [proposalSubmitting, setProposalSubmitting] = useState(false);
  const [proposalSuccess, setProposalSuccess] = useState(false);
  const [proposalData, setProposalData] = useState({
    description: '',
    referenceUrl: '',
    whatsapp: '',
    isPrivate: false
  });

  useEffect(() => {
    updatePageTitle('Catalog');
    if (!user && !isInitialLoading) return;

    (async () => {
      setLoading(true);
      try {
        const catSnap = await getDocs(query(collection(db, 'categories'), where('hidden', '==', false)));
        setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
        const prodSnap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
        setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      } catch (err) { 
        console.error(err); 
      } finally { 
        setLoading(false); 
      }
    })();
  }, [user, isInitialLoading]);

  useEffect(() => {
    const catFromUrl = searchParams.get('category');
    if (catFromUrl && catFromUrl !== category) {
      setCategory(catFromUrl);
    }
  }, [searchParams]);

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    setSearchParams({ category: newCat });
  };

  const filteredProducts = useMemo(() => 
    products.filter(p => 
      (user?.isAdmin || !p.hidden) && 
      (category === 'All' || p.category === category) && 
      p.name.toLowerCase().includes(search.toLowerCase())
    ), [products, category, search, user]);

  const handleProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('warning', 'AUTHENTICATION REQUIRED TO SUBMIT PROPOSALS.');
      return;
    }
    setProposalSubmitting(true);
    try {
      await addDoc(collection(db, 'proposals'), {
        ...proposalData,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      const config = (settings as any).telegram;
      if (config?.botToken && config?.chatId) {
        sendTelegramNotification(
          config.botToken, 
          config.chatId, 
          `<b>[NEW ASSET PROPOSAL]</b>\nUser: ${user.displayName}\nEmail: ${user.email}\nTier: ${proposalData.isPrivate ? 'Private' : 'Public'}\n\nDescription: ${proposalData.description}\n\nReference: ${proposalData.referenceUrl}\nWA: ${proposalData.whatsapp}`
        );
      }

      setProposalSuccess(true);
      showToast('success', 'PROPOSAL TRANSMITTED. ENGINEERING REVIEW INITIALIZED.');
      setTimeout(() => {
        setIsProposalOpen(false);
        setProposalSuccess(false);
        setProposalData({ description: '', referenceUrl: '', whatsapp: '', isPrivate: false });
      }, 3000);
    } catch (err) {
      console.error(err);
      showToast('error', 'TRANSMISSION FAILED. TERMINAL ERROR.');
    } finally {
      setProposalSubmitting(false);
    }
  };

  if (!user && !isInitialLoading) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 min-h-screen">
      <div className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-400 mb-1">
            <Layers className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em]">Resource Arsenal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">Product Catalog</h1>
          <p className="text-zinc-500 text-[10px] md:text-[11px] font-black uppercase tracking-widest mt-1">Authenticated Terminal Access</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
        <aside className="w-full lg:w-72 space-y-8">
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 px-1">Filter Search</h4>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-white transition-colors" />
              <input 
                type="text" 
                placeholder="Find script..." 
                className="w-full bg-zinc-950 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-xs focus:outline-none focus:border-white/20 font-bold transition-all" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 px-1">Classifications</h4>
            <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 scrollbar-hide snap-x">
              <button 
                onClick={() => handleCategoryChange('All')} 
                className={`px-4 py-3 rounded-lg text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all text-left flex items-center justify-between min-w-max lg:min-w-[120px] snap-start ${category === 'All' ? 'bg-white text-black' : 'text-zinc-500 hover:bg-white/5 bg-zinc-950/50 lg:bg-transparent border border-white/5 lg:border-none'}`}
              >
                All Assets{category === 'All' && <div className="w-1.5 h-1.5 bg-black rounded-full ml-3 lg:ml-0" />}
              </button>
              {categories.map(c => (
                <button 
                  key={c.id} 
                  onClick={() => handleCategoryChange(c.name)} 
                  className={`px-4 py-3 rounded-lg text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all text-left flex items-center justify-between min-w-max lg:min-w-[120px] snap-start ${category === c.name ? 'bg-white text-black' : 'text-zinc-500 hover:bg-white/5 bg-zinc-950/50 lg:bg-transparent border border-white/5 lg:border-none'}`}
                >
                  {c.name}{category === c.name && <div className="w-1.5 h-1.5 bg-black rounded-full ml-3 lg:ml-0" />}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <div className="flex items-center justify-between mb-8 pb-3 border-b border-white/5">
            <div className="text-[10px] md:text-[11px] font-black uppercase text-zinc-500 tracking-widest">
              {loading ? 'Decrypting Repository...' : <>Displaying <span className="text-white">{filteredProducts.length}</span> verified units</>}
            </div>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4 text-zinc-800">
              <Loader2 className="w-10 h-10 animate-spin" />
              <p className="text-[11px] font-black uppercase tracking-widest">Establishing Secure Stream</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredProducts.map(p => (
                <Link key={p.id} to={`/product/${p.slug || p.id}`} className="group flex flex-col sm:flex-row sm:items-center gap-5 bg-[#0a0a0a] border border-white/5 p-4.5 rounded-[1.5rem] hover:border-white/20 transition-all hover:bg-zinc-900/30">
                  <div className="w-full sm:w-28 h-28 sm:h-20 flex-shrink-0 bg-black rounded-xl overflow-hidden border border-white/5">
                    <img src={p.imageUrls[0]} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" alt={p.name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-1">
                      <div className="min-w-0">
                        <h3 className="text-lg md:text-xl font-black uppercase italic tracking-tight group-hover:text-green-500 transition-colors leading-tight mb-2 truncate">{p.name}</h3>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-[9px] font-black uppercase bg-white/5 text-zinc-400 px-2.5 py-1 rounded border border-white/5">{p.category}</span>
                          <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-tighter">REF: {p.id.slice(0,8).toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="sm:text-right flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-4 border-t border-white/5 pt-3 sm:border-0 sm:pt-0">
                        <div className="flex flex-col sm:items-end">
                           <span className="font-mono text-xl font-black text-green-400 tracking-tighter leading-none">${p.price}</span>
                           <span className="text-[8px] font-black text-zinc-600 uppercase mt-1">Secure Deal</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              <div className="mt-8 p-10 md:p-14 bg-zinc-950/50 border border-dashed border-white/10 rounded-[2rem] flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-white/20">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg md:text-xl font-black uppercase italic text-white">Missing something?</h4>
                  <p className="text-[10px] md:text-[11px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Propose a custom build to our engineering team.</p>
                </div>
                <button onClick={() => setIsProposalOpen(true)} className="px-10 py-4 bg-white/5 hover:bg-white hover:text-black border border-white/10 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all">Open Proposal Form</button>
              </div>

              {filteredProducts.length === 0 && !loading && (
                <div className="py-24 text-center">
                  <EyeOff className="w-12 h-12 mx-auto mb-4 text-zinc-800" />
                  <p className="text-[11px] font-black uppercase text-zinc-700 tracking-[0.3em] italic">No active units match your search.</p>
                  <button onClick={() => { setSearch(''); setCategory('All'); }} className="mt-4 text-[10px] font-black text-white border-b border-white pb-1 uppercase">Reset Terminal</button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {isProposalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => !proposalSubmitting && setIsProposalOpen(false)} />
          <div className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {proposalSuccess ? (
              <div className="p-16 text-center space-y-6">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-black uppercase italic">Transmission Received</h3>
                <p className="text-[11px] text-zinc-500 font-black uppercase tracking-[0.2em]">Engineering review in progress.</p>
              </div>
            ) : (
              <form onSubmit={handleProposalSubmit}>
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/40">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <h3 className="font-black text-[11px] md:text-xs uppercase italic tracking-widest">Asset Synthesis</h3>
                  </div>
                  <button type="button" onClick={() => setIsProposalOpen(false)} className="p-2 hover:bg-white/5 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Objective Details</label>
                    <textarea required placeholder="Specify your requirements..." className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm font-bold focus:border-white outline-none resize-none h-24 transition-all" value={proposalData.description} onChange={e => setProposalData({...proposalData, description: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Reference Hub</label>
                      <input type="url" placeholder="https://..." className="w-full bg-black border border-white/10 rounded-lg py-3 px-4 text-xs font-mono focus:border-white outline-none" value={proposalData.referenceUrl} onChange={e => setProposalData({...proposalData, referenceUrl: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Contact Number</label>
                      <input required type="tel" placeholder="+..." className="w-full bg-black border border-white/10 rounded-lg py-3 px-4 text-xs font-mono focus:border-white outline-none" value={proposalData.whatsapp} onChange={e => setProposalData({...proposalData, whatsapp: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Exclusivity Tier</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setProposalData({...proposalData, isPrivate: false})} className={`p-3.5 rounded-lg border text-[10px] font-black uppercase transition-all ${!proposalData.isPrivate ? 'bg-white text-black border-white shadow-lg' : 'bg-black/40 border-white/5 text-zinc-500'}`}>Public</button>
                      <button type="button" onClick={() => setProposalData({...proposalData, isPrivate: true})} className={`p-3.5 rounded-lg border text-[10px] font-black uppercase transition-all ${proposalData.isPrivate ? 'bg-white text-black border-white shadow-lg' : 'bg-black/40 border-white/5 text-zinc-500'}`}>Private</button>
                    </div>
                  </div>
                  <button disabled={proposalSubmitting} type="submit" className="w-full bg-white text-black py-5 rounded-xl font-black uppercase tracking-[0.2em] text-[11px] md:text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3">
                    {proposalSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Transmit Proposal <Send className="w-4 h-4" /></>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
