
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, 
  ShieldCheck, 
  ShoppingCart, 
  Clock,
  Zap,
  Lock,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Cog,
  Search,
  Sparkles,
  DollarSign,
  Image as ImageIcon,
  Bell,
  ArrowRight,
  LayoutDashboard,
  Activity,
  Star,
  MessageSquare,
  Send,
  User
} from 'lucide-react';
import { useAppContext } from '../AppContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, getDocs, updateDoc, doc, arrayUnion } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { Order, Product } from '../types';
import { updatePageTitle } from '../lib/utils';
import { useToast } from '../components/Toast';

export const Dashboard = () => {
  const { user, addToCart, isInitialLoading: appLoading } = useAppContext();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'proposals' | 'updates'>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Feedback State
  const [feedbackUpdateId, setFeedbackUpdateId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [ratingValue, setRatingValue] = useState(0);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Notification State
  const [unreadUpdatesCount, setUnreadUpdatesCount] = useState(0);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [stats, setStats] = useState({
    totalAssets: 0,
    pendingOrders: 0,
    totalSpent: 0
  });

  useEffect(() => {
    updatePageTitle('My Account');
    
    if (!appLoading && !user) {
      navigate('/login');
      return;
    }

    if (!user) return;

    setLoading(true);

    const qOrders = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid)
    );

    const unsubOrders = onSnapshot(qOrders, (snap) => {
      let ordersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      ordersData.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setOrders(ordersData);
      
      const totalAssets = ordersData.filter(o => o.status === 'completed').reduce((acc, o) => acc + (o.items?.length || 0), 0);
      const pendingOrders = ordersData.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'processing').length;
      const totalSpent = ordersData.reduce((acc, o) => acc + (o.totalPrice || 0), 0);

      setStats({ totalAssets, pendingOrders, totalSpent });
    }, (err) => {
      console.error("Orders sync error:", err);
    });

    const qProposals = query(
      collection(db, 'proposals'),
      where('userId', '==', user.uid)
    );

    const unsubProposals = onSnapshot(qProposals, (snap) => {
      const proposalsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      proposalsData.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setProposals(proposalsData);
      setLoading(false);
    }, (err) => {
      console.error("Proposals sync error:", err);
      setLoading(false);
    });

    const qUpdates = query(
      collection(db, 'updates'),
      orderBy('createdAt', 'desc')
    );

    const unsubUpdates = onSnapshot(qUpdates, (snap) => {
      const updatesData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUpdates(updatesData);

      // Check for unread updates
      const lastSeenStr = localStorage.getItem(`last_seen_updates_${user?.uid}`);
      const lastSeen = lastSeenStr ? parseInt(lastSeenStr) : 0;
      
      const unread = updatesData.filter(u => {
        const createdAt = u.createdAt?.seconds ? u.createdAt.seconds * 1000 : 0;
        return createdAt > lastSeen;
      }).length;
      
      setUnreadUpdatesCount(unread);
    });

    getDocs(collection(db, 'products')).then(snap => {
      setAllProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    return () => {
      unsubOrders();
      unsubProposals();
      unsubUpdates();
    };
  }, [user, appLoading, navigate]);

  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
    
    // Clear notifications if switching to updates tab
    if (activeTab === 'updates' && user) {
      localStorage.setItem(`last_seen_updates_${user.uid}`, Date.now().toString());
      setUnreadUpdatesCount(0);
    }
  }, [activeTab, user]);

  const handleOrderProposal = (proposal: any) => {
    const displayImage = (proposal.imageUrls && proposal.imageUrls.length > 0) 
      ? proposal.imageUrls[0] 
      : 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80';

    const customProduct: Product = {
      id: `custom-${proposal.id}`,
      slug: `custom-${proposal.id}`,
      name: `Custom Build: ${proposal.description.substring(0, 30)}...`,
      description: proposal.description,
      price: proposal.estimatedCost,
      imageUrls: [displayImage],
      category: 'Custom Synthesis',
      isCustom: true,
      modelUrl: '', 
      hidden: true
    };
    
    addToCart(customProduct);
    navigate('/checkout');
  };

  const submitFeedback = async (updateId: string) => {
    if (!user || (!commentText && ratingValue === 0)) return;
    setSubmittingFeedback(true);
    try {
      const updateRef = doc(db, 'updates', updateId);
      const payload: any = {};
      
      if (commentText) {
        payload.comments = arrayUnion({
          userId: user.uid,
          userName: user.displayName,
          text: commentText,
          createdAt: new Date()
        });
      }
      
      if (ratingValue > 0) {
        payload.ratings = arrayUnion({
          userId: user.uid,
          value: ratingValue
        });
      }

      await updateDoc(updateRef, payload);
      showToast('success', 'FEEDBACK COMMITTED TO SIGNAL LOG.');
      setCommentText('');
      setRatingValue(0);
      setFeedbackUpdateId(null);
    } catch (err) {
      console.error(err);
      showToast('error', 'FEEDBACK TRANSMISSION FAILED.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const filteredOrders = useMemo(() => 
    orders.filter(o => 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      o.items?.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ), [orders, searchQuery]);

  const filteredProposals = useMemo(() => 
    proposals.filter(p => 
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ), [proposals, searchQuery]);

  const filteredUpdates = useMemo(() =>
    updates.filter(u =>
      u.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.content.toLowerCase().includes(searchQuery.toLowerCase())
    ), [updates, searchQuery]);

  const paginate = (data: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = (data: any[]) => Math.ceil(data.length / itemsPerPage);

  const PaginationControls = ({ totalItems }: { totalItems: number }) => {
    const total = totalPages(new Array(totalItems).fill(0));
    if (total <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-10 pt-8 border-t border-white/5">
        <p className="text-[11px] md:text-xs font-black uppercase text-zinc-500 tracking-[0.2em]">
          Logs {Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(totalItems, currentPage * itemsPerPage)} / {totalItems}
        </p>
        <div className="flex items-center gap-3">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="p-3 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white disabled:opacity-20 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="bg-zinc-900 border border-white/5 px-5 py-2.5 rounded-xl text-xs font-black tracking-widest">
            {currentPage} / {total}
          </div>
          <button 
            disabled={currentPage >= total}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="p-3 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white disabled:opacity-20 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  if (appLoading || (user && loading)) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-10 h-10 animate-spin text-zinc-500" />
        <p className="text-[11px] md:text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Decrypting Account Data...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-10 md:py-14 min-h-screen max-w-7xl animate-in fade-in duration-500">
      {/* Refined Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full mb-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Link Verified</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-none text-white">My Account</h1>
          <p className="text-zinc-500 text-[10px] md:text-xs font-black uppercase tracking-[0.15em]">
            Operator: <span className="text-zinc-300">{user?.displayName}</span> • ID: <span className="text-zinc-300 font-mono">{user?.uid.slice(0, 8)}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link to="/templates" className="flex-1 md:flex-none text-center bg-white text-black px-6 py-3.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl active:scale-95">
            Browse Arsenal
          </Link>
          {user?.isAdmin && (
            <Link to="/admin" className="flex-1 md:flex-none text-center bg-blue-600/10 border border-blue-500/20 text-blue-400 px-6 py-3.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl">
              Admin Console
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 md:gap-10">
        <aside className="lg:col-span-1 space-y-6">
          <div className="space-y-2">
             <h4 className="px-3 text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-2">Command Menu</h4>
             <button 
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center justify-between py-5 px-6 rounded-xl transition-all group ${activeTab === 'overview' ? 'bg-white text-black' : 'bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 text-zinc-500'}`}
             >
                <div className="flex items-center gap-4">
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="text-xs font-black uppercase tracking-widest">Overview</span>
                </div>
                <ChevronRight className={`w-4 h-4 ${activeTab === 'overview' ? 'text-black' : 'text-zinc-700'}`} />
             </button>
             <button 
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center justify-between py-5 px-6 rounded-xl transition-all group ${activeTab === 'orders' ? 'bg-white text-black' : 'bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 text-zinc-500'}`}
             >
                <div className="flex items-center gap-4">
                  <Package className="w-5 h-5" />
                  <span className="text-xs font-black uppercase tracking-widest">Acquisition Logs</span>
                </div>
                <ChevronRight className={`w-4 h-4 ${activeTab === 'orders' ? 'text-black' : 'text-zinc-700'}`} />
             </button>
             <button 
                onClick={() => setActiveTab('proposals')}
                className={`w-full flex items-center justify-between py-5 px-6 rounded-xl transition-all group ${activeTab === 'proposals' ? 'bg-white text-black' : 'bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 text-zinc-500'}`}
             >
                <div className="flex items-center gap-4">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-xs font-black uppercase tracking-widest">Custom Synthetics</span>
                </div>
                <ChevronRight className={`w-4 h-4 ${activeTab === 'proposals' ? 'text-black' : 'text-zinc-700'}`} />
             </button>
             <button 
                onClick={() => setActiveTab('updates')}
                className={`w-full flex items-center justify-between py-5 px-6 rounded-xl transition-all group relative ${activeTab === 'updates' ? 'bg-white text-black' : 'bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 text-zinc-500'}`}
             >
                <div className="flex items-center gap-4">
                  <Bell className="w-5 h-5" />
                  <span className="text-xs font-black uppercase tracking-widest">Platform Signals</span>
                  {unreadUpdatesCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center bg-green-500 text-white text-[9px] font-black rounded-full ring-2 ring-zinc-950 animate-pulse">
                      {unreadUpdatesCount}
                    </span>
                  )}
                </div>
                <ChevronRight className={`w-4 h-4 ${activeTab === 'updates' ? 'text-black' : 'text-zinc-700'}`} />
             </button>
          </div>
        </aside>

        <section className="lg:col-span-3 space-y-6 flex flex-col min-h-[600px]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-1">
            <h2 className="text-xs md:text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3 italic text-white/80">
              {activeTab === 'overview' ? <LayoutDashboard className="w-5 h-5" /> : activeTab === 'orders' ? <Package className="w-5 h-5" /> : activeTab === 'proposals' ? <Sparkles className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              {activeTab === 'overview' ? 'Account Performance' : activeTab === 'orders' ? 'Acquisition Logs' : activeTab === 'proposals' ? 'Custom Synthetics' : 'Platform Signals'}
            </h2>
            {activeTab !== 'overview' && (
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Search entries..."
                  className="w-full bg-zinc-900 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-xs font-black uppercase focus:outline-none focus:border-white/20 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex-1">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
                <div className="p-8 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] group hover:bg-zinc-900 transition-all">
                  <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-4">Assets Owned</p>
                  <div className="flex items-center justify-between">
                    <h3 className="text-5xl font-black italic">{stats.totalAssets}</h3>
                    <div className="p-3 bg-white/5 rounded-xl">
                      <Package className="w-6 h-6 text-zinc-400" />
                    </div>
                  </div>
                </div>
                <div className="p-8 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] group hover:bg-zinc-900 transition-all">
                  <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-4">Active Processing</p>
                  <div className="flex items-center justify-between">
                    <h3 className="text-5xl font-black italic text-yellow-500">{stats.pendingOrders}</h3>
                    <div className="p-3 bg-yellow-500/10 rounded-xl">
                      <Clock className="w-6 h-6 text-yellow-500" />
                    </div>
                  </div>
                </div>
                <div className="p-8 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] group hover:bg-zinc-900 transition-all">
                  <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-4">Total Volume</p>
                  <div className="flex items-center justify-between">
                    <h3 className="text-4xl font-black italic text-green-400 tracking-tighter">${stats.totalSpent.toFixed(2)}</h3>
                    <div className="p-3 bg-green-500/10 rounded-xl">
                      <DollarSign className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-3 p-12 bg-black border border-white/5 rounded-[3rem] text-center space-y-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-8 h-8 text-white/20" />
                  </div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tight">Terminal Session Active</h3>
                  <p className="text-[11px] md:text-xs text-zinc-500 font-black uppercase tracking-[0.2em] max-w-lg mx-auto leading-relaxed">
                    Operator access verified. All telemetry links are operational. Acquisition logs ready for synchronization.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="animate-in fade-in duration-300">
                {filteredOrders.length === 0 ? (
                  <div className="py-24 text-center bg-[#0a0a0a] border border-dashed border-white/5 rounded-[3rem]">
                    <Package className="w-14 h-14 mx-auto mb-6 opacity-10" />
                    <p className="text-xs font-black uppercase text-zinc-700 italic tracking-[0.2em]">No assets found in vault.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-6">
                      {paginate(filteredOrders).map(order => (
                        <div key={order.id} className="bg-zinc-950 border border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-white/10 transition-all shadow-xl">
                          <div className="px-6 py-4.5 bg-zinc-900/30 border-b border-white/5 flex flex-wrap items-center justify-between gap-6">
                            <div className="flex items-center gap-8">
                              <div className="flex flex-col">
                                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-1">Entry ID</span>
                                <span className="text-xs font-mono font-black text-zinc-400 uppercase">#{order.id.slice(0, 8)}</span>
                              </div>
                              <div className={`px-3 py-1.5 rounded-xl border border-white/5 text-[9px] font-black uppercase flex items-center gap-3 ${
                                order.status === 'completed' ? 'text-green-400 bg-green-400/5' : 
                                order.status === 'preparing' || order.status === 'processing' ? 'text-blue-400 bg-blue-400/5' : 'text-yellow-500 bg-yellow-500/5'
                              }`}>
                                {order.status === 'completed' ? <ShieldCheck className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                {order.status}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xl font-mono font-black text-green-400">${(order.totalPrice || 0).toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="p-6 space-y-4">
                            {order.items?.map((item: any) => (
                              <div key={item.configId || item.id} className="flex items-center gap-5">
                                <img src={item.imageUrls?.[0]} className="w-14 h-14 object-cover rounded-xl border border-white/10" alt="" />
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-black uppercase italic truncate">{item.name}</h4>
                                </div>
                                {order.status === 'completed' && (
                                  <a href={item.modelUrl} target="_blank" className="p-3 bg-white text-black rounded-xl hover:scale-105 transition-all"><Download className="w-4 h-4" /></a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <PaginationControls totalItems={filteredOrders.length} />
                  </>
                )}
              </div>
            )}

            {activeTab === 'proposals' && (
              <div className="animate-in fade-in duration-300">
                {filteredProposals.length === 0 ? (
                  <div className="py-24 text-center bg-[#0a0a0a] border border-dashed border-white/5 rounded-[3rem]">
                    <Sparkles className="w-14 h-14 mx-auto mb-6 opacity-10" />
                    <p className="text-xs font-black uppercase text-zinc-700 italic tracking-[0.2em]">No custom builds requested.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-6">
                      {paginate(filteredProposals).map(proposal => (
                        <div key={proposal.id} className="bg-zinc-950 border border-white/5 rounded-[2.5rem] p-6 group hover:border-white/10 transition-all shadow-xl">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-4">
                            <div className="relative w-16 h-16 flex-shrink-0">
                              {(proposal.imageUrls && proposal.imageUrls.length > 0) ? (
                                <img src={proposal.imageUrls[0]} className="w-full h-full object-cover rounded-2xl border border-white/10" alt="" />
                              ) : (
                                <div className="w-full h-full bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-center"><ImageIcon className="w-6 h-6 text-zinc-800" /></div>
                              )}
                            </div>
                            <div className="flex-1 px-0 sm:px-4">
                              <div className="flex items-center gap-4 mb-2">
                                <span className="text-[10px] font-mono text-zinc-600 uppercase">#{proposal.id.slice(0,8)}</span>
                                <span className={`px-3 py-1 rounded text-[9px] font-black uppercase ${proposal.status === 'accepted' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-500'}`}>{proposal.status}</span>
                              </div>
                              <p className="text-xs font-bold text-zinc-300 leading-relaxed uppercase italic line-clamp-2">{proposal.description}</p>
                            </div>
                            {proposal.status === 'accepted' && proposal.estimatedCost && (
                              <button onClick={() => handleOrderProposal(proposal)} className="bg-white text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg">Initialize Build</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <PaginationControls totalItems={filteredProposals.length} />
                  </>
                )}
              </div>
            )}

            {activeTab === 'updates' && (
              <div className="animate-in fade-in duration-300">
                {filteredUpdates.length === 0 ? (
                  <div className="py-24 text-center bg-[#0a0a0a] border border-dashed border-white/5 rounded-[3rem]">
                    <Bell className="w-14 h-14 mx-auto mb-6 opacity-10" />
                    <p className="text-xs font-black uppercase text-zinc-700 italic tracking-[0.2em]">No signals detected.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-6">
                      {paginate(filteredUpdates).map(signal => {
                        const linkedAsset = signal.linkedProductId ? allProducts.find(p => p.id === signal.linkedProductId) : null;
                        return (
                          <div key={signal.id} className="bg-zinc-950 border border-white/5 rounded-[2.5rem] p-8 group hover:border-white/10 transition-all shadow-xl">
                            <div className="flex items-start gap-6">
                              <div className={`p-4 rounded-xl flex-shrink-0 ${signal.type === 'security' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                <Bell className="w-6 h-6" />
                              </div>
                              <div className="flex-1 space-y-4">
                                <div>
                                  <div className="flex items-center gap-4 mb-2">
                                    <span className="px-2.5 py-1 rounded text-[9px] font-black uppercase bg-zinc-800 text-zinc-500">{signal.type}</span>
                                    <span className="text-[9px] font-mono text-zinc-700 uppercase">
                                      {signal.createdAt?.seconds ? new Date(signal.createdAt.seconds * 1000).toLocaleDateString() : 'RECENT'}
                                    </span>
                                  </div>
                                  <h3 className="text-lg md:text-xl font-black uppercase italic tracking-tight mb-2 leading-tight">{signal.title}</h3>
                                  <p className="text-xs md:text-sm text-zinc-400 leading-relaxed font-medium">{signal.content}</p>
                                </div>
                                {linkedAsset && (
                                  <div className="p-4 bg-zinc-900 border border-white/5 rounded-2xl flex items-center justify-between group/asset">
                                    <div className="flex items-center gap-4">
                                      <img src={linkedAsset.imageUrls[0]} className="w-10 h-10 rounded-xl object-cover" alt="" />
                                      <p className="text-xs font-black uppercase italic">{linkedAsset.name}</p>
                                    </div>
                                    <Link to={`/product/${linkedAsset.slug || linkedAsset.id}`} className="p-2 bg-white text-black rounded-lg"><ArrowRight className="w-4 h-4" /></Link>
                                  </div>
                                )}
                                
                                {/* Rating and Comments Preview */}
                                <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-6">
                                  <div className="flex items-center gap-6">
                                    <button 
                                      onClick={() => setFeedbackUpdateId(feedbackUpdateId === signal.id ? null : signal.id)}
                                      className="flex items-center gap-2 text-[10px] md:text-xs font-black uppercase text-zinc-500 hover:text-white transition-colors"
                                    >
                                      <MessageSquare className="w-4 h-4" /> {signal.comments?.length || 0} Feedback
                                    </button>
                                    <div className="flex items-center gap-2 text-[10px] md:text-xs font-black uppercase text-zinc-500">
                                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> 
                                      {signal.ratings?.length > 0 
                                        ? (signal.ratings.reduce((acc: number, r: any) => acc + r.value, 0) / signal.ratings.length).toFixed(1)
                                        : '0.0'}
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => setFeedbackUpdateId(feedbackUpdateId === signal.id ? null : signal.id)}
                                    className="text-[9px] md:text-xs font-black uppercase px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all"
                                  >
                                    {feedbackUpdateId === signal.id ? 'Close' : 'Add Feedback'}
                                  </button>
                                </div>

                                {/* Feedback Form & List */}
                                {feedbackUpdateId === signal.id && (
                                  <div className="mt-6 p-6 bg-black/40 border border-white/5 rounded-[2rem] space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="space-y-4">
                                      <div className="flex items-center gap-3">
                                        {[1,2,3,4,5].map(star => (
                                          <button 
                                            key={star} 
                                            type="button" 
                                            onClick={() => setRatingValue(star)}
                                            className="transition-transform active:scale-90"
                                          >
                                            <Star className={`w-5 h-5 ${star <= ratingValue ? 'fill-yellow-500 text-yellow-500' : 'text-zinc-700'}`} />
                                          </button>
                                        ))}
                                        <span className="text-[10px] font-black uppercase text-zinc-600 ml-3">Rating Level</span>
                                      </div>
                                      <div className="relative">
                                        <textarea 
                                          placeholder="Transmit signal feedback..."
                                          className="w-full bg-zinc-950 border border-white/10 rounded-2xl p-4 text-[11px] font-bold focus:border-white/30 outline-none resize-none h-24 transition-all"
                                          value={commentText}
                                          onChange={e => setCommentText(e.target.value)}
                                        />
                                        <button 
                                          disabled={submittingFeedback || (!commentText && ratingValue === 0)}
                                          onClick={() => submitFeedback(signal.id)}
                                          className="absolute bottom-4 right-4 p-2.5 bg-white text-black rounded-xl hover:scale-105 active:scale-95 disabled:opacity-20 transition-all"
                                        >
                                          {submittingFeedback ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        </button>
                                      </div>
                                    </div>

                                    {signal.comments?.length > 0 && (
                                      <div className="space-y-4 border-t border-white/5 pt-6 max-h-64 overflow-y-auto pr-3 scrollbar-hide">
                                        {signal.comments.map((c: any, idx: number) => (
                                          <div key={idx} className="flex gap-4 group">
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/5">
                                              <User className="w-4 h-4 text-zinc-500" />
                                            </div>
                                            <div className="flex-1 space-y-1.5">
                                              <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase text-zinc-400">{c.userName}</span>
                                                <span className="text-[9px] font-mono text-zinc-700 uppercase">
                                                  {c.createdAt?.seconds ? new Date(c.createdAt.seconds * 1000).toLocaleTimeString() : 'RECENT'}
                                                </span>
                                              </div>
                                              <p className="text-[11px] md:text-xs text-zinc-500 font-medium leading-relaxed">{c.text}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <PaginationControls totalItems={filteredUpdates.length} />
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
