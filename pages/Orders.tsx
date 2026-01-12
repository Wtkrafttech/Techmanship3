
import React, { useState, useEffect } from 'react';
import { Download, Package, Clock, Loader2, ShieldCheck, Cog } from 'lucide-react';
import { useAppContext } from '../AppContext';
import { Order } from '../types';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

export const Orders = () => {
  const { user } = useAppContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    console.log("Initializing Order Stream for UID:", user.uid);

    // Primary query with ordering
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Orders stream error (likely missing index):", error);
      
      // Fallback: Fetch without ordering if the index is missing, then sort client-side
      const fallbackQuery = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid)
      );
      
      getDocs(fallbackQuery).then((snap) => {
        const fallbackData = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];
        
        // Manual sort by createdAt
        fallbackData.sort((a: any, b: any) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
        
        setOrders(fallbackData);
        setLoading(false);
      }).catch(err => {
        console.error("Complete fallback failure:", err);
        setLoading(false);
      });
    });

    return () => unsub();
  }, [user]);

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest">Accessing Secure Vault...</p>
      </div>
    );
  }

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'pending': return { label: 'Verification Required', color: 'text-yellow-500 bg-yellow-500/10' };
      case 'preparing': return { label: 'Synthesizing Asset', color: 'text-blue-500 bg-blue-500/10' };
      case 'completed': return { label: 'Clearance Granted', color: 'text-green-500 bg-green-500/10' };
      default: return { label: status, color: 'text-zinc-500 bg-zinc-500/10' };
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 min-h-[70vh]">
      <div className="mb-12">
        <h1 className="text-4xl font-black tracking-tight mb-2 uppercase italic">My Assets</h1>
        <p className="text-muted-foreground uppercase text-[10px] tracking-widest font-bold">Authenticated Repository Access</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-24 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] space-y-6">
          <div className="relative inline-block">
             <Package className="w-16 h-16 mx-auto opacity-10" />
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border border-white/20 rounded-full animate-ping" />
             </div>
          </div>
          <p className="text-zinc-500 uppercase text-[10px] font-black tracking-[0.2em]">Repository is currently empty.</p>
          <button onClick={() => window.location.href='#/templates'} className="bg-white text-black px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-transform">Initialize Acquisition</button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => {
            const statusInfo = getStatusDisplay(order.status);
            return (
              <div key={order.id} className="bg-card border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl transition-all hover:border-white/20 group">
                <div className="p-6 bg-zinc-950/50 border-b border-white/5 flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex gap-12">
                    <div>
                      <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest mb-1">Module ID</p>
                      <p className="text-xs font-mono font-bold uppercase text-zinc-300">ORD-{order.id.slice(0, 8)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest mb-1">Clearance Status</p>
                      <p className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl ${statusInfo.color} flex items-center gap-2 border border-white/5`}>
                        {order.status === 'pending' && <Clock className="w-3 h-3" />}
                        {order.status === 'preparing' && <Cog className="w-3 h-3 animate-spin" />}
                        {order.status === 'completed' && <ShieldCheck className="w-3 h-3" />}
                        {statusInfo.label}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest mb-1">Transaction Value</p>
                    <p className="text-xl font-mono font-black italic text-green-400">${order.totalPrice.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="p-8 space-y-8">
                  {order.items.map((item: any) => (
                    <div key={item.configId || item.id} className="flex flex-col sm:flex-row gap-8 items-center">
                      <div className="relative">
                        <img src={item.imageUrls?.[0]} className="w-28 h-28 object-cover rounded-3xl border border-white/10" alt={item.name} />
                        {order.status === 'completed' && <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 shadow-lg shadow-green-500/20"><ShieldCheck className="w-4 h-4 text-black" /></div>}
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <h4 className="font-black text-xl mb-2 uppercase italic tracking-tight">{item.name}</h4>
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                          {item.selectedHosting && <span className="text-[8px] font-black uppercase bg-blue-500/10 text-blue-400 px-2 py-1 rounded-lg border border-blue-500/10">Cloud Stack Ready</span>}
                          {item.selectedDomain && <span className="text-[8px] font-black uppercase bg-purple-500/10 text-purple-400 px-2 py-1 rounded-lg border border-purple-500/10">DNS Configured</span>}
                          {item.selectedInbox && <span className="text-[8px] font-black uppercase bg-orange-500/10 text-orange-400 px-2 py-1 rounded-lg border border-orange-500/10">Inbox Tier Alpha</span>}
                        </div>
                      </div>
                      <div className="flex gap-4">
                        {order.status === 'completed' ? (
                          <a 
                            href={item.modelUrl} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-green-400 transition-all hover:scale-105 shadow-xl"
                          >
                            <Download className="w-4 h-4" /> Finalize Download
                          </a>
                        ) : (
                          <div className="group/btn relative">
                            <button className="flex items-center gap-3 border border-white/5 bg-white/5 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest cursor-not-allowed text-zinc-600">
                              <Clock className="w-4 h-4" /> Resource Locked
                            </button>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap bg-black border border-white/10 p-2 rounded-lg text-[8px] font-black uppercase tracking-widest z-10 pointer-events-none">
                              Pending Admin Signature
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
