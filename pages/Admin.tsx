
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Package, ShoppingBag, Shield, Edit3, Trash2, 
  Plus, Loader2, Eye, EyeOff, X, Save, 
  Layers, Settings as SettingsIcon, Globe, Wallet, 
  Cog, Sparkles, MessageSquare, Lock, Unlock, CheckCircle, Clock, DollarSign, Image as ImageIcon,
  Send, Zap, Ban, UserCheck, AlertTriangle, ChevronLeft, ChevronRight, ExternalLink, Link as LinkIcon, Bell,
  TrendingUp, BarChart3, PieChart, Activity, Briefcase, Video
} from 'lucide-react';
import { useAppContext } from '../AppContext';
import { db } from '../lib/firebase';
import { Product, Category, Order, OrderStatus, PaymentSettings } from '../types';
import { 
  collection, getDocs, updateDoc, doc, query, orderBy, 
  setDoc, addDoc, deleteDoc, onSnapshot, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { slugify, updatePageTitle } from '../lib/utils';
import { sendTelegramNotification } from '../lib/notifications';
import { useToast } from '../components/Toast';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'products' | 'categories' | 'orders' | 'settings' | 'proposals' | 'updates'>('overview');
  const { user: currentUser, settings: globalSettings, updateSettings } = useAppContext();
  const { showToast } = useToast();
  
  // Data State
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [settings, setSettings] = useState(globalSettings);

  // New Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [newPaymentData, setNewPaymentData] = useState<PaymentSettings>({ cryptocurrency: '', walletAddress: '', qrCodeUrl: '' });

  // Update Form State
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);
  const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null);
  const [updateFormData, setUpdateFormData] = useState({ title: '', content: '', type: 'feature', linkedProductId: '' });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Proposal Edit State
  const [proposalCosts, setProposalCosts] = useState<Record<string, string>>({});
  const [proposalImages, setProposalImages] = useState<Record<string, string>>({});

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });

  // Modals/Editing State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', slug: '', price: 0, category: '', description: '', imageUrls: [], modelUrl: '', previewUrl: '', hidden: false,
    hosting: { enabled: false, price: 0, billingCycle: 'monthly' },
    customDomain: { enabled: false, price: 0, billingCycle: 'yearly' },
    inboxAddon: { enabled: false, price: 0, billingCycle: 'monthly' }
  });
  const [isCatFormOpen, setIsCatFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catFormData, setCatFormData] = useState<Partial<Category>>({
    name: '', imageUrl: '', hidden: false
  });

  useEffect(() => {
    updatePageTitle('Admin Control Center');
    
    const unsubUsers = onSnapshot(query(collection(db, 'users'), orderBy('displayName', 'asc')), (snap) => {
      setUsers(snap.docs.map(doc => ({ ...doc.data(), uid: doc.id })));
    });
    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Order));
    });
    const unsubProposals = onSnapshot(query(collection(db, 'proposals'), orderBy('createdAt', 'desc')), (snap) => {
      setProposals(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubProducts = onSnapshot(query(collection(db, 'products'), orderBy('name', 'asc')), (snap) => {
      setProducts(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product)));
      setLoading(false);
    });
    const unsubCategories = onSnapshot(query(collection(db, 'categories'), orderBy('name', 'asc')), (snap) => {
      setCategories(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Category)));
    });
    const unsubUpdates = onSnapshot(query(collection(db, 'updates'), orderBy('createdAt', 'desc')), (snap) => {
      setUpdates(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubUsers();
      unsubOrders();
      unsubProposals();
      unsubProducts();
      unsubCategories();
      unsubUpdates();
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const analytics = useMemo(() => {
    const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const pendingRevenue = orders.filter(o => o.status === 'pending').reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const conversionRate = users.length > 0 ? (orders.filter(o => o.status === 'completed').length / users.length) * 100 : 0;
    const avgOrderValue = orders.filter(o => o.status === 'completed').length > 0 
      ? totalRevenue / orders.filter(o => o.status === 'completed').length 
      : 0;

    const topCategories = categories.map(cat => ({
      name: cat.name,
      count: products.filter(p => p.category === cat.name).length
    })).sort((a, b) => b.count - a.count);

    return { totalRevenue, pendingRevenue, conversionRate, avgOrderValue, topCategories };
  }, [orders, users, products, categories]);

  const paginate = (data: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = (data: any[]) => Math.ceil(data.length / itemsPerPage);

  const PaginationControls = ({ totalItems }: { totalItems: number }) => {
    const total = totalPages(new Array(totalItems).fill(0));
    if (total <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">
          Showing {Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(totalItems, currentPage * itemsPerPage)} of {totalItems}
        </p>
        <div className="flex items-center gap-2">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="p-2 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="bg-zinc-900 border border-white/5 px-4 py-2 rounded-xl text-[10px] font-black">
            PAGE {currentPage} / {total}
          </div>
          <button 
            disabled={currentPage >= total}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="p-2 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const requestConfirmation = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' = 'warning') => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, type });
  };

  const deleteUpdate = (updateId: string) => {
    requestConfirmation(
      "RETRACT UPDATE",
      "Remove this broadcast from all user feeds? This action cannot be undone.",
      async () => {
        try { 
          await deleteDoc(doc(db, 'updates', updateId)); 
          showToast('warning', 'BROADCAST RETRACTED: REMOVED FROM FEED.');
        } catch (err) { showToast('error', 'RETRACTION FAILED.'); }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      'danger'
    );
  };

  const handleEditUpdate = (update: any) => {
    setEditingUpdateId(update.id);
    setUpdateFormData({
      title: update.title,
      content: update.content,
      type: update.type,
      linkedProductId: update.linkedProductId || ''
    });
    setIsUpdateFormOpen(true);
  };

  const deleteProposal = (proposalId: string) => {
    requestConfirmation(
      "VOID PROPOSAL",
      "Remove this synthesis request from the log? This action is permanent.",
      async () => {
        try { 
          await deleteDoc(doc(db, 'proposals', proposalId)); 
          showToast('error', 'PROPOSAL VOIDED: RECORD STRIPPED.');
        } catch (err) { showToast('error', 'DELETE FAILED.'); }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      'danger'
    );
  };

  const toggleBan = (uid: string, currentBan: boolean) => {
    const action = currentBan ? "Restore" : "Terminate";
    requestConfirmation(
      `${action.toUpperCase()} ACCESS`,
      `Are you sure you want to ${action.toLowerCase()} access for this operator? Clearance protocols will be updated immediately.`,
      async () => {
        try { 
          await updateDoc(doc(db, 'users', uid), { isSuspended: !currentBan }); 
          if (!currentBan) showToast('warning', 'SECURITY ALERT: OPERATOR ACCESS TERMINATED.');
          else showToast('success', 'CLEARANCE RESTORED: OPERATOR RE-INSTATED.');
        } catch (err) { showToast('error', 'OPERATION FAILED: SYSTEM TIMEOUT.'); }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    );
  };

  const purgeUser = (uid: string) => {
    if (uid === currentUser?.uid) { 
      showToast('error', 'CRITICAL ERROR: SELF-PURGE PROTOCOL DENIED.'); 
      return; 
    }
    requestConfirmation(
      "PERMANENT DATA STRIP",
      "This action will permanently purge this operator from all registries. This cannot be reversed.",
      async () => {
        try { 
          await deleteDoc(doc(db, 'users', uid)); 
          showToast('error', 'DATA PURGED: OPERATOR REMOVED FROM ALL REGISTRIES.');
        } catch (err) { showToast('error', 'PURGE SEQUENCE FAILED.'); }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      'danger'
    );
  };

  const deleteProduct = (productId: string) => {
    requestConfirmation(
      "VOID ASSET",
      "Permanently remove this asset from the repository? All associated configuration data will be lost.",
      async () => {
        try { 
          await deleteDoc(doc(db, 'products', productId)); 
          showToast('warning', 'ASSET REMOVED: DATA STRIPPED FROM REPOSITORY.');
        } catch (err) { showToast('error', 'DELETE FAILED.'); }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      'danger'
    );
  };

  const deleteCategory = (categoryId: string) => {
    requestConfirmation(
      "VOID CLASSIFICATION",
      "Remove this category classification? Assets assigned to this category may lose indexing context.",
      async () => {
        try { 
          await deleteDoc(doc(db, 'categories', categoryId)); 
          showToast('warning', 'CATEGORY VOIDED: INDEX UPDATED.');
        } catch (err) { showToast('error', 'DELETE FAILED.'); }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      'danger'
    );
  };

  const toggleAdmin = async (uid: string, currentAdmin: boolean) => {
    try { 
      await updateDoc(doc(db, 'users', uid), { isAdmin: !currentAdmin }); 
      showToast('success', `CLEARANCE UPDATED: ${!currentAdmin ? 'ADMIN' : 'OPERATOR'} LEVEL SET.`);
    }
    catch (err) { showToast('error', 'CLEARANCE UPDATE FAILED.'); }
  };

  const handleTestTelegram = async () => {
    const config = (settings as any).telegram;
    if (!config?.botToken || !config?.chatId) return showToast('error', 'TELEGRAM CONFIG INCOMPLETE.');
    setTestingTelegram(true);
    const msg = `<b>[SYSTEM HEARTBEAT]</b>\nTerminal: ${settings.appName}\nStatus: Verified`;
    const result = await sendTelegramNotification(config.botToken, config.chatId, msg);
    if (result.success) showToast('success', 'SIGNAL TRANSMITTED: TELEGRAM LINK ACTIVE.');
    else showToast('error', 'SIGNAL FAILED: CONNECTION REFUSED.');
    setTestingTelegram(false);
  };

  const handleUpdateProposal = async (proposalId: string) => {
    const cost = parseFloat(proposalCosts[proposalId]);
    if (isNaN(cost)) return showToast('error', 'SYNTHESIS ERROR: NUMERIC COST REQUIRED.');
    
    const imageUrls = proposalImages[proposalId] 
      ? proposalImages[proposalId].split(',').map(s => s.trim()).filter(s => s) 
      : [];

    try {
      await updateDoc(doc(db, 'proposals', proposalId), { 
        status: 'accepted', 
        estimatedCost: cost,
        imageUrls: imageUrls 
      });
      showToast('success', 'PROPOSAL AUTHORIZED: COST & VISUALS COMMITTED.');
    } catch (err) { showToast('error', 'AUTHORIZATION FAILED.'); }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), settings);
      updateSettings(settings);
      showToast('success', 'CORE SYNC: SYSTEM SETTINGS COMMITTED TO CLOUD.');
    } catch (err) { showToast('error', 'COMMIT FAILED: DATABASE REJECTION.'); } finally { setLoading(false); }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData, slug: formData.slug || slugify(formData.name || '') };
      if (editingProduct) await updateDoc(doc(db, 'products', editingProduct.id), payload);
      else await addDoc(collection(db, 'products'), { ...payload, createdAt: new Date() });
      showToast('success', editingProduct ? 'ASSET UPDATED: REPOSITORY SYNCED.' : 'SYNTHESIS COMPLETE: NEW ASSET DEPLOYED.');
      setIsFormOpen(false);
    } catch (err) { showToast('error', 'SAVE FAILED: RESOURCE ALLOCATION ERROR.'); } finally { setLoading(false); }
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingUpdateId) {
        await updateDoc(doc(db, 'updates', editingUpdateId), {
          ...updateFormData,
          updatedAt: serverTimestamp()
        });
        showToast('success', 'BROADCAST UPDATED: SIGNALS RE-TRANSMITTED.');
      } else {
        await addDoc(collection(db, 'updates'), {
          ...updateFormData,
          createdAt: serverTimestamp(),
          comments: [],
          ratings: []
        });
        showToast('success', 'BROADCAST COMMITTED: USER FEEDS UPDATED.');
      }
      setIsUpdateFormOpen(false);
      setEditingUpdateId(null);
      setUpdateFormData({ title: '', content: '', type: 'feature', linkedProductId: '' });
    } catch (err) { showToast('error', 'BROADCAST FAILED: SYSTEM ERROR.'); } finally { setLoading(false); }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try { 
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus }); 
      showToast('success', `LOG UPDATE: TRANSACTION ${orderId.slice(0,8).toUpperCase()} SET TO ${newStatus.toUpperCase()}.`);
    }
    catch (err) { showToast('error', 'STATUS UPDATE FAILED.'); }
  };

  const handleOpenForm = (product?: Product) => {
    if (product) { setEditingProduct(product); setFormData({ ...product }); }
    else {
      setEditingProduct(null);
      setFormData({ 
        name: '', price: 0, category: categories[0]?.name || '', description: '', imageUrls: [], modelUrl: '', previewUrl: '', hidden: false,
        hosting: { enabled: false, price: 0, billingCycle: 'monthly' },
        customDomain: { enabled: false, price: 0, billingCycle: 'yearly' },
        inboxAddon: { enabled: false, price: 0, billingCycle: 'monthly' }
      });
    }
    setIsFormOpen(true);
  };

  const handleOpenCatForm = (category?: Category) => {
    if (category) { setEditingCategory(category); setCatFormData({ ...category }); }
    else { setEditingCategory(null); setCatFormData({ name: '', imageUrl: '', hidden: false }); }
    setIsCatFormOpen(true);
  };

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedGateways = settings.gateways ? [...settings.gateways, newPaymentData] : [newPaymentData];
    const newSettings = {
      ...settings,
      gateways: updatedGateways
    };
    
    // Optimistic UI update
    setSettings(newSettings);
    
    try {
      // Persist directly to Firestore to ensure it's saved
      await setDoc(doc(db, 'settings', 'global'), newSettings);
      updateSettings(newSettings);
      setIsPaymentModalOpen(false);
      showToast('success', 'PAYMENT GATEWAY ADDED: CORE STACK RECONFIGURED.');
    } catch (err) {
      console.error("Failed to save new gateway:", err);
      showToast('error', 'FAILED TO SAVE GATEWAY TO CLOUD.');
    }
  };

  const removeGateway = async (index: number) => {
    const updatedGateways = settings.gateways.filter((_, i) => i !== index);
    const newSettings = { ...settings, gateways: updatedGateways };
    setSettings(newSettings);
    
    try {
      await setDoc(doc(db, 'settings', 'global'), newSettings);
      updateSettings(newSettings);
      showToast('warning', 'GATEWAY REMOVED FROM REGISTRY.');
    } catch (err) {
      showToast('error', 'FAILED TO REMOVE GATEWAY FROM CLOUD.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} />
          <div className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${confirmModal.type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
              <AlertTriangle className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-xl font-black uppercase italic text-center mb-2 tracking-tight">{confirmModal.title}</h3>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] text-center leading-relaxed mb-8">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 px-6 py-4 bg-zinc-900 text-zinc-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all"
              >
                Abort
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className={`flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${confirmModal.type === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-white text-black hover:bg-zinc-200'}`}
              >
                Confirm Protocol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)} />
          <div className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black uppercase italic mb-6 tracking-tight">Add Payment Gateway</h3>
            <form onSubmit={handleAddPaymentMethod} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Currency / Network</label>
                <input required placeholder="BTC / ETH / SOL" className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm font-bold" value={newPaymentData.cryptocurrency} onChange={e => setNewPaymentData({...newPaymentData, cryptocurrency: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Wallet Address</label>
                <input required placeholder="0x..." className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm font-mono" value={newPaymentData.walletAddress} onChange={e => setNewPaymentData({...newPaymentData, walletAddress: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">QR Code URL</label>
                <input required placeholder="https://..." className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm font-mono" value={newPaymentData.qrCodeUrl} onChange={e => setNewPaymentData({...newPaymentData, qrCodeUrl: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 mt-2 transition-all active:scale-95"><Save className="w-4 h-4" /> Commit Gateway</button>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 space-y-2">
          <div className="mb-8 px-4">
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">Control Room</h1>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">Operator: {currentUser?.displayName}</p>
          </div>
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'proposals', label: 'Proposals', icon: Sparkles },
            { id: 'updates', label: 'News Feed', icon: Bell },
            { id: 'products', label: 'Assets', icon: Package },
            { id: 'categories', label: 'Categories', icon: Layers },
            { id: 'orders', label: 'Transactions', icon: ShoppingBag },
            { id: 'settings', label: 'System', icon: SettingsIcon },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-white text-black shadow-lg translate-x-1' : 'hover:bg-accent text-zinc-500'}`}
            >
              <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest">
                <tab.icon className="w-4 h-4" /> {tab.label}
              </div>
            </button>
          ))}
        </aside>

        <main className="flex-1 bg-card border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl relative min-h-[600px] flex flex-col">
          <div className="p-8 flex-1">
            {activeTab === 'overview' && (
              <div className="animate-in fade-in duration-500 space-y-8">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight">Analytical Matrix</h2>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Deep System Analysis & Real-time Telemetry</p>
                  </div>
                  <div className="bg-zinc-900 border border-white/5 px-4 py-2 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-green-500 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> LIVE SYNC ACTIVE
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-6 bg-zinc-900/40 border border-white/5 rounded-[2rem] group hover:border-white/10 transition-all">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3">Gross Revenue</p>
                    <div className="flex items-center justify-between">
                      <h3 className="text-3xl font-black italic text-green-400 font-mono">${analytics.totalRevenue.toLocaleString()}</h3>
                      <BarChart3 className="w-5 h-5 text-zinc-700 group-hover:text-green-400 transition-colors" />
                    </div>
                  </div>
                  <div className="p-6 bg-zinc-900/40 border border-white/5 rounded-[2rem] group hover:border-white/10 transition-all">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3">Pending Capital</p>
                    <div className="flex items-center justify-between">
                      <h3 className="text-3xl font-black italic text-blue-400 font-mono">${analytics.pendingRevenue.toLocaleString()}</h3>
                      <Activity className="w-5 h-5 text-zinc-700 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>
                  <div className="p-6 bg-zinc-900/40 border border-white/5 rounded-[2rem] group hover:border-white/10 transition-all">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3">Conversion Log</p>
                    <div className="flex items-center justify-between">
                      <h3 className="text-3xl font-black italic text-purple-400 font-mono">{analytics.conversionRate.toFixed(1)}%</h3>
                      <PieChart className="w-5 h-5 text-zinc-700 group-hover:text-purple-400 transition-colors" />
                    </div>
                  </div>
                  <div className="p-6 bg-zinc-900/40 border border-white/5 rounded-[2rem] group hover:border-white/10 transition-all">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3">Avg Ticket Size</p>
                    <div className="flex items-center justify-between">
                      <h3 className="text-3xl font-black italic text-white font-mono">${analytics.avgOrderValue.toFixed(0)}</h3>
                      <TrendingUp className="w-5 h-5 text-zinc-700 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-8 bg-zinc-950 border border-white/5 rounded-[2.5rem] shadow-xl">
                    <h3 className="text-sm font-black uppercase italic mb-6 tracking-widest flex items-center gap-2">
                      <Layers className="w-4 h-4 text-zinc-500" /> Sector Density
                    </h3>
                    <div className="space-y-4">
                      {analytics.topCategories.slice(0, 5).map((cat, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <span className="text-zinc-400">{cat.name}</span>
                            <span className="text-white">{cat.count} Units</span>
                          </div>
                          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-white transition-all duration-1000 ease-out" 
                              style={{ width: `${(cat.count / products.length) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-8 bg-zinc-950 border border-white/5 rounded-[2.5rem] shadow-xl">
                    <h3 className="text-sm font-black uppercase italic mb-6 tracking-widest flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-zinc-500" /> Operations Queue
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-zinc-900/40 rounded-2xl border border-white/5">
                        <p className="text-[8px] font-black uppercase text-zinc-500 mb-1">Users</p>
                        <p className="text-2xl font-black italic">{users.length}</p>
                      </div>
                      <div className="p-4 bg-zinc-900/40 rounded-2xl border border-white/5">
                        <p className="text-[8px] font-black uppercase text-zinc-500 mb-1">Proposals</p>
                        <p className="text-2xl font-black italic">{proposals.filter(p => p.status === 'pending').length}</p>
                      </div>
                      <div className="p-4 bg-zinc-900/40 rounded-2xl border border-white/5">
                        <p className="text-[8px] font-black uppercase text-zinc-600 mb-1">Products</p>
                        <p className="text-2xl font-black italic text-zinc-400">{products.length}</p>
                      </div>
                      <div className="p-4 bg-zinc-900/40 rounded-2xl border border-white/5">
                        <p className="text-[8px] font-black uppercase text-zinc-600 mb-1">Updates</p>
                        <p className="text-2xl font-black italic text-zinc-400">{updates.length}</p>
                      </div>
                    </div>
                    <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center gap-4">
                      <Shield className="w-8 h-8 text-blue-500/50" />
                      <div className="text-[9px] font-black uppercase text-blue-400 tracking-widest">
                        Clearance Level: Alpha-X Authorized Operator
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-xl font-black mb-8 uppercase italic">User Registry</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-muted-foreground font-black uppercase tracking-widest text-[10px]">
                        <th className="pb-4">Alias</th>
                        <th className="pb-4">Clearance</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {paginate(users).map(u => (
                        <tr key={u.uid} className={`group hover:bg-white/[0.02] ${u.isSuspended ? 'opacity-50' : ''}`}>
                          <td className="py-4 font-bold">{u.displayName}<div className="text-[9px] text-zinc-500 font-mono">{u.email}</div></td>
                          <td className="py-4">
                            <button onClick={() => toggleAdmin(u.uid, !!u.isAdmin)} disabled={u.uid === currentUser?.uid} className={`px-2 py-1 rounded text-[10px] font-black uppercase ${u.isAdmin ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-800 text-zinc-400'}`}>{u.isAdmin ? 'Admin' : 'Operator'}</button>
                          </td>
                          <td className="py-4 text-[9px] font-black uppercase">{u.isSuspended ? <span className="text-red-500">Banned</span> : <span className="text-green-500">Active</span>}</td>
                          <td className="py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {u.uid !== currentUser?.uid && (
                                <>
                                  <button onClick={() => toggleBan(u.uid, !!u.isSuspended)} className={`p-2 rounded-xl transition-colors ${u.isSuspended ? 'text-green-400 hover:bg-green-400/10' : 'text-amber-400 hover:bg-amber-400/10'}`}>{u.isSuspended ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}</button>
                                  <button onClick={() => purgeUser(u.uid)} className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationControls totalItems={users.length} />
              </div>
            )}

            {activeTab === 'updates' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-black uppercase italic">System Broadcasts</h2>
                  <button onClick={() => { setEditingUpdateId(null); setUpdateFormData({ title: '', content: '', type: 'feature', linkedProductId: '' }); setIsUpdateFormOpen(true); }} className="bg-foreground text-background px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2"><Plus className="w-3 h-3" /> NEW BROADCAST</button>
                </div>
                <div className="space-y-4">
                  {paginate(updates).map(u => (
                    <div key={u.id} className="p-6 bg-zinc-950/40 border border-white/5 rounded-3xl flex items-center justify-between group">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${u.type === 'feature' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>{u.type}</span>
                          <h4 className="font-bold text-sm uppercase italic">{u.title}</h4>
                        </div>
                        <p className="text-[10px] text-zinc-500 truncate max-w-xl">{u.content}</p>
                        <div className="flex items-center gap-4 mt-2">
                          {u.linkedProductId && (
                            <div className="inline-flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/5 text-[8px] font-black uppercase text-zinc-400">
                              <Package className="w-3 h-3" /> Linked Asset: {products.find(p => p.id === u.linkedProductId)?.name || 'Unknown Asset'}
                            </div>
                          )}
                          <div className="text-[8px] font-black uppercase text-zinc-600 tracking-widest">
                            {u.comments?.length || 0} Feedback • {u.ratings?.length || 0} Ratings
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEditUpdate(u)} className="p-2 text-zinc-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => deleteUpdate(u.id)} className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                  {updates.length === 0 && <div className="py-20 text-center text-zinc-700 text-[10px] font-black uppercase tracking-widest">No signals currently broadcasted.</div>}
                </div>
                <PaginationControls totalItems={updates.length} />
              </div>
            )}

            {activeTab === 'proposals' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-xl font-black mb-8 uppercase italic">Asset Proposals</h2>
                <div className="grid grid-cols-1 gap-6">
                  {paginate(proposals).map(p => (
                    <div key={p.id} className="p-6 bg-zinc-950/40 border border-white/5 rounded-[2rem] group relative">
                      <button 
                        onClick={() => deleteProposal(p.id)}
                        className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 bg-black/40 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-48 h-32 flex-shrink-0 bg-black rounded-2xl overflow-hidden border border-white/5 relative">
                          {(proposalImages[p.id] || p.imageUrls?.[0]) ? (
                            <img src={proposalImages[p.id]?.split(',')[0].trim() || p.imageUrls?.[0]} className="w-full h-full object-cover" alt="Proposal Preview" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-800 gap-2">
                              <ImageIcon className="w-8 h-8" />
                              <span className="text-[8px] font-black uppercase">No Media Attached</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400"><Sparkles className="w-4 h-4" /></div>
                              <div>
                                <h4 className="font-bold text-sm uppercase italic">{p.userName}</h4>
                                <p className="text-[10px] text-zinc-500">{p.userEmail}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${p.status === 'accepted' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
                              {p.status}
                            </span>
                          </div>

                          <div className="p-4 bg-black rounded-2xl border border-white/5 text-xs text-zinc-300 leading-relaxed mb-4">
                            {p.description}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex gap-3 text-[10px] font-black uppercase">
                              <a href={p.referenceUrl} target="_blank" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/5 px-3 py-1.5 rounded-lg border border-blue-500/10">
                                <LinkIcon className="w-3 h-3" /> Reference Link
                              </a>
                              <a href={`https://wa.me/${p.whatsapp?.replace(/\+/g, '')}`} target="_blank" className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors bg-green-500/5 px-3 py-1.5 rounded-lg border border-green-500/10">
                                <MessageSquare className="w-3 h-3" /> WhatsApp
                              </a>
                            </div>

                            {p.status === 'pending' && (
                              <div className="flex flex-col gap-2 w-full max-w-sm mt-4">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
                                    <input 
                                      type="number" 
                                      placeholder="Synth Cost" 
                                      className="w-full bg-black border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs font-mono" 
                                      value={proposalCosts[p.id] || ''} 
                                      onChange={e => setProposalCosts({...proposalCosts, [p.id]: e.target.value})} 
                                    />
                                  </div>
                                  <div className="relative">
                                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
                                    <input 
                                      type="text" 
                                      placeholder="Asset Images (CSV)" 
                                      className="w-full bg-black border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs font-mono" 
                                      value={proposalImages[p.id] || ''} 
                                      onChange={e => setProposalImages({...proposalImages, [p.id]: e.target.value})} 
                                    />
                                  </div>
                                </div>
                                <button 
                                  onClick={() => handleUpdateProposal(p.id)} 
                                  className="w-full py-2 bg-foreground text-background rounded-xl text-[10px] font-black uppercase hover:scale-[1.01] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                  Authorize Engineering Build
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <PaginationControls totalItems={proposals.length} />
              </div>
            )}

            {activeTab === 'products' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-black uppercase italic">Asset Repositories</h2>
                  <button onClick={() => handleOpenForm()} className="bg-foreground text-background px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2"><Plus className="w-3 h-3" /> NEW ASSET</button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {paginate(products).map(p => (
                    <div key={p.id} className={`flex items-center gap-4 p-4 border border-white/5 rounded-2xl ${p.hidden ? 'opacity-60 bg-zinc-900/50' : 'bg-background'}`}>
                      <img src={p.imageUrls[0]} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1 truncate"><h4 className="font-black uppercase italic">{p.name}</h4><p className="text-[10px] font-mono text-zinc-500 uppercase">${p.price} • {p.category}</p></div>
                      <div className="flex gap-1">
                        <button onClick={() => updateDoc(doc(db,'products',p.id), {hidden: !p.hidden})} className="p-2">{p.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                        <button onClick={() => handleOpenForm(p)} className="p-2 text-blue-400"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => deleteProduct(p.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <PaginationControls totalItems={products.length} />
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-black uppercase italic">Categories</h2>
                  <button onClick={() => handleOpenCatForm()} className="bg-foreground text-background px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2"><Plus className="w-3 h-3" /> NEW CATEGORY</button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {paginate(categories).map(c => (
                    <div key={c.id} className="flex items-center gap-4 p-4 border border-white/5 rounded-2xl bg-background">
                      <img src={c.imageUrl} className="w-10 h-10 rounded-lg object-cover" />
                      <div className="flex-1"><h4 className="font-black uppercase italic">{c.name}</h4></div>
                      <div className="flex gap-1">
                        <button onClick={() => handleOpenCatForm(c)} className="p-2 text-blue-400"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => deleteCategory(c.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <PaginationControls totalItems={categories.length} />
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-xl font-black mb-8 uppercase italic">Transactions</h2>
                <div className="space-y-4">
                  {paginate(orders).map(order => (
                    <div key={order.id} className="p-6 bg-zinc-950/40 border border-white/5 rounded-3xl flex items-center justify-between group">
                      <div>
                        <div className="flex items-center gap-2 text-[10px] mb-1">
                          <span className="font-mono text-zinc-600 uppercase">#{order.id.slice(0, 8)}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${order.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>{order.status}</span>
                        </div>
                        <div className="font-bold text-sm uppercase italic truncate max-w-[200px]">{order.items?.[0]?.name}</div>
                        <div className="text-[9px] text-zinc-500 uppercase">{(order as any).userEmail}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-mono font-black text-green-400">${order.totalPrice?.toFixed(2)}</div>
                        <div className="flex gap-1">
                          <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><Cog className="w-4 h-4" /></button>
                          <button onClick={() => updateOrderStatus(order.id, 'completed')} className="p-2 bg-green-500/10 text-green-400 rounded-lg"><CheckCircle className="w-4 h-4" /></button>
                          <button onClick={() => { 
                            requestConfirmation(
                              "PURGE LOG",
                              "Remove this transaction record from the database? This will not affect the user's asset access.",
                              async () => {
                                try {
                                  await deleteDoc(doc(db,'orders',order.id)); 
                                  showToast('warning', 'LOG PURGED: TRANSACTION RECORD ERASED.');
                                } catch (err) { showToast('error', 'PURGE FAILED.'); }
                                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                              }
                            );
                          }} className="p-2 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <PaginationControls totalItems={orders.length} />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
                  <h2 className="text-xl font-black uppercase italic">System Core</h2>
                  <div className="flex gap-2">
                    <button onClick={handleTestTelegram} disabled={testingTelegram} className="bg-zinc-800 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                      {testingTelegram ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />} TEST SIGNAL
                    </button>
                    <button onClick={handleSaveSettings} className="bg-foreground text-background px-6 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2"><Save className="w-4 h-4" /> COMMIT</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-[10px] font-black uppercase text-zinc-500 border-b border-white/5 pb-2 mb-4 tracking-widest">Branding & SEO</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">App Name</label>
                          <input type="text" className="w-full bg-background border border-white/5 rounded-xl p-3 text-sm font-bold" value={settings.appName} onChange={e => setSettings({...settings, appName: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">SEO Description</label>
                          <textarea className="w-full bg-background border border-white/5 rounded-xl p-3 text-sm h-24 font-medium" value={settings.seoDescription} onChange={e => setSettings({...settings, seoDescription: e.target.value})} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-[10px] font-black uppercase text-zinc-500 border-b border-white/5 pb-2 mb-4 tracking-widest">Hero Configuration</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Background Type</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setSettings({...settings, hero: {...settings.hero, backgroundType: 'image'}})} className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-[10px] font-black uppercase transition-all ${settings.hero.backgroundType === 'image' ? 'bg-white text-black border-white' : 'bg-black border-white/10 text-zinc-500'}`}><ImageIcon className="w-3.5 h-3.5" /> Image</button>
                            <button onClick={() => setSettings({...settings, hero: {...settings.hero, backgroundType: 'video'}})} className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-[10px] font-black uppercase transition-all ${settings.hero.backgroundType === 'video' ? 'bg-white text-black border-white' : 'bg-black border-white/10 text-zinc-500'}`}><Video className="w-3.5 h-3.5" /> Video</button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Headline</label>
                          <input type="text" className="w-full bg-background border border-white/5 rounded-xl p-3 text-sm font-bold" value={settings.hero.headline} onChange={e => setSettings({...settings, hero: {...settings.hero, headline: e.target.value}})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Background URL (Image/Video)</label>
                          <input type="text" className="w-full bg-background border border-white/5 rounded-xl p-3 text-sm font-mono" value={settings.hero.backgroundUrl} onChange={e => setSettings({...settings, hero: {...settings.hero, backgroundUrl: e.target.value}})} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-[10px] font-black uppercase text-zinc-500 border-b border-white/5 pb-2 mb-4 tracking-widest flex items-center justify-between">
                        <span>Payment Gateways</span>
                        <button 
                          type="button" 
                          className="text-[8px] flex items-center gap-1 hover:text-white transition-colors"
                          onClick={() => {
                            setNewPaymentData({ cryptocurrency: '', walletAddress: '', qrCodeUrl: '' });
                            setIsPaymentModalOpen(true);
                          }}
                        >
                          <Plus className="w-2.5 h-2.5" /> ADD NEW
                        </button>
                      </h3>
                      <div className="space-y-3">
                        {settings.gateways?.map((gw, idx) => (
                          <div key={idx} className="p-4 bg-zinc-950/40 border border-white/5 rounded-2xl flex items-center justify-between group">
                            <div className="min-w-0">
                              <p className="text-[10px] font-black uppercase text-white">{gw.cryptocurrency}</p>
                              <p className="text-[8px] font-mono text-zinc-500 truncate">{gw.walletAddress}</p>
                            </div>
                            <button onClick={() => removeGateway(idx)} className="p-2 text-zinc-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {(!settings.gateways || settings.gateways.length === 0) && (
                          <p className="text-[8px] font-black uppercase text-zinc-700 text-center py-4">No gateways registered.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-[10px] font-black uppercase text-zinc-500 border-b border-white/5 pb-2 mb-4 tracking-widest">Telegram Intel Link</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Bot Token</label>
                          <input type="password" placeholder="••••••••" className="w-full bg-background border border-white/5 rounded-xl p-3 text-sm font-mono" value={(settings as any).telegram?.botToken || ''} onChange={e => setSettings({...settings, telegram: {...((settings as any).telegram || {}), botToken: e.target.value}})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Chat ID</label>
                          <input type="text" placeholder="-100..." className="w-full bg-background border border-white/5 rounded-xl p-3 text-sm font-mono" value={(settings as any).telegram?.chatId || ''} onChange={e => setSettings({...settings, telegram: {...((settings as any).telegram || {}), chatId: e.target.value}})} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {isUpdateFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setIsUpdateFormOpen(false); setEditingUpdateId(null); }} />
          <div className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-black text-lg uppercase italic mb-6">{editingUpdateId ? 'Edit Signal Broadcast' : 'New Signal Broadcast'}</h3>
            <form onSubmit={handlePostUpdate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Signal Title</label>
                <input required placeholder="E.g. V2 Protocol Deployed" className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm font-bold" value={updateFormData.title} onChange={e => setUpdateFormData({...updateFormData, title: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Signal Type</label>
                <select className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm font-black uppercase" value={updateFormData.type} onChange={e => setUpdateFormData({...updateFormData, type: e.target.value})}>
                  <option value="feature">System Feature</option>
                  <option value="security">Security Alert</option>
                  <option value="news">Platform News</option>
                  <option value="release">Asset Release</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Link to Asset (Optional)</label>
                <select className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm font-black uppercase" value={updateFormData.linkedProductId} onChange={e => setUpdateFormData({...updateFormData, linkedProductId: e.target.value})}>
                  <option value="">No Asset Linked</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Signal Content</label>
                <textarea required placeholder="Brief description of the update..." className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm h-32 resize-none" value={updateFormData.content} onChange={e => setUpdateFormData({...updateFormData, content: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 mt-2 hover:scale-[1.02] transition-all"><Send className="w-4 h-4" /> {editingUpdateId ? 'Update Signal' : 'Broadcast Signal'}</button>
            </form>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-zinc-950 border border-white/10 rounded-[2rem] p-8 overflow-y-auto">
            <h3 className="font-black text-lg uppercase italic mb-8">{editingProduct ? 'Edit Module' : 'New Asset'}</h3>
            <form onSubmit={handleSaveProduct} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Asset Name</label>
                  <input required placeholder="Module Alias" className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Base Price (USD)</label>
                  <input required type="number" placeholder="0.00" className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Classification</label>
                <select className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Technical Brief</label>
                <textarea placeholder="Describe asset capabilities..." className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm h-32" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Visual Registry (Comma-separated URLs)</label>
                <input placeholder="https://image1.jpg, https://image2.jpg" className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm" value={formData.imageUrls?.join(', ')} onChange={e => setFormData({...formData, imageUrls: e.target.value.split(',').map(s => s.trim())})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Secure Source URL</label>
                  <input placeholder="G-Drive / Mega Link" className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm" value={formData.modelUrl} onChange={e => setFormData({...formData, modelUrl: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Preview Link (Optional)</label>
                  <div className="relative">
                    <input placeholder="https://demo.com" className="w-full bg-black border border-white/10 rounded-xl p-3 pl-10 text-sm" value={formData.previewUrl} onChange={e => setFormData({...formData, previewUrl: e.target.value})} />
                    <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/5">
                <div className="space-y-2 p-4 bg-black/40 border border-white/5 rounded-2xl">
                  <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-blue-400">
                    <input type="checkbox" checked={formData.hosting?.enabled} onChange={e => setFormData({...formData, hosting: {...(formData.hosting || {enabled: false, price: 0, billingCycle: 'monthly'}), enabled: e.target.checked}})} />
                    Hosting Add-on
                  </label>
                  <input type="number" placeholder="Price" className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs" value={formData.hosting?.price} onChange={e => setFormData({...formData, hosting: {...(formData.hosting || {enabled: false, price: 0, billingCycle: 'monthly'}), price: parseFloat(e.target.value)}})} />
                </div>
                <div className="space-y-2 p-4 bg-black/40 border border-white/5 rounded-2xl">
                  <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-purple-400">
                    <input type="checkbox" checked={formData.customDomain?.enabled} onChange={e => setFormData({...formData, customDomain: {...(formData.customDomain || {enabled: false, price: 0, billingCycle: 'yearly'}), enabled: e.target.checked}})} />
                    Domain
                  </label>
                  <input type="number" placeholder="Price" className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs" value={formData.customDomain?.price} onChange={e => setFormData({...formData, customDomain: {...(formData.customDomain || {enabled: false, price: 0, billingCycle: 'yearly'}), price: parseFloat(e.target.value)}})} />
                </div>
                <div className="space-y-2 p-4 bg-black/40 border border-white/5 rounded-2xl">
                  <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-orange-400">
                    <input type="checkbox" checked={formData.inboxAddon?.enabled} onChange={e => setFormData({...formData, inboxAddon: {...(formData.inboxAddon || {enabled: false, price: 0, billingCycle: 'monthly'}), enabled: e.target.checked}})} />
                    SMTP
                  </label>
                  <input type="number" placeholder="Price" className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs" value={formData.inboxAddon?.price} onChange={e => setFormData({...formData, inboxAddon: {...(formData.inboxAddon || {enabled: false, price: 0, billingCycle: 'monthly'}), price: parseFloat(e.target.value)}})} />
                </div>
              </div>

              <button type="submit" className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 mt-4"><Save className="w-4 h-4" /> Commit to Repository</button>
            </form>
          </div>
        </div>
      )}

      {isCatFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsCatFormOpen(false)} />
          <div className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-black uppercase italic mb-6 tracking-tight">{editingCategory ? 'Update Classification' : 'Define New Category'}</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (editingCategory) await updateDoc(doc(db, 'categories', editingCategory.id), catFormData);
                else await addDoc(collection(db, 'categories'), { ...catFormData, hidden: false });
                showToast('success', editingCategory ? 'CLASSIFICATION UPDATED.' : 'CLASSIFICATION DEFINED.');
                setIsCatFormOpen(false);
              } catch (err) { showToast('error', 'OPERATION FAILED: REJECTION.'); }
            }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Category Name</label>
                <input required placeholder="General / Specialized" className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm" value={catFormData.name} onChange={e => setCatFormData({...catFormData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Index Image URL</label>
                <input required placeholder="https://..." className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm" value={catFormData.imageUrl} onChange={e => setCatFormData({...catFormData, imageUrl: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-white text-black py-3 rounded-xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 mt-2"><Save className="w-4 h-4" /> Commit Index</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
