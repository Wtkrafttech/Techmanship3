
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ChevronLeft, ShoppingCart, ExternalLink, Code, Globe, 
  Check, Loader2, Cpu, Terminal, FileCode, Server, Cloud, 
  ShieldCheck, ArrowRight, Mail, BookOpen
} from 'lucide-react';
import { useAppContext } from '../AppContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, limit } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { Product } from '../types';
import { updatePageTitle } from '../lib/utils';

export const ProductDetail = () => {
  const { slug } = useParams();
  const { addToCart } = useAppContext();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  
  const [includeHosting, setIncludeHosting] = useState(false);
  const [includeDomain, setIncludeDomain] = useState(false);
  const [includeInbox, setIncludeInbox] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const q = query(collection(db, 'products'), where('slug', '==', slug), limit(1));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const doc = snap.docs[0];
          const data = { id: doc.id, ...doc.data() } as Product;
          setProduct(data);
          updatePageTitle(data.name);
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-6 text-muted-foreground">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="text-xs md:text-sm font-black uppercase tracking-widest">Initialising Module Preview</p>
      </div>
    );
  }

  if (!product) return (
    <div className="p-24 text-center">
      <h2 className="text-2xl font-bold mb-6">Module not found</h2>
      <Link to="/templates" className="text-sm underline uppercase tracking-widest">Back to catalog</Link>
    </div>
  );

  const handleAddToCart = () => {
    addToCart(product, { 
      hosting: includeHosting && product.hosting?.enabled, 
      domain: includeDomain && product.customDomain?.enabled,
      inbox: includeInbox && product.inboxAddon?.enabled
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const calculateTotal = () => {
    let total = product.price;
    if (includeHosting && product.hosting?.enabled) total += product.hosting.price;
    if (includeDomain && product.customDomain?.enabled) total += product.customDomain.price;
    if (includeInbox && product.inboxAddon?.enabled) total += product.inboxAddon.price;
    return total;
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-12 max-w-6xl">
      <Link to="/templates" className="inline-flex items-center gap-3 text-zinc-500 hover:text-white mb-6 md:mb-10 text-[11px] md:text-xs transition-colors uppercase font-black tracking-widest">
        <ChevronLeft className="w-4 h-4" /> Back to Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
        <div className="space-y-6">
          <div className="relative aspect-video bg-[#080808] border border-white/10 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl group ring-1 ring-white/5">
            <img src={product.imageUrls[activeImage]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={product.name} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-6 right-6">
               <div className="px-4 py-1.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/80 flex items-center gap-2.5">
                 <Terminal className="w-3.5 h-3.5" /> TECH-PREVIEW
               </div>
            </div>
          </div>
          
          <div className="p-4 bg-zinc-950/40 border border-white/5 rounded-[2rem] md:rounded-[2.5rem] shadow-inner overflow-hidden">
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Documentation Screenshots ({product.imageUrls.length})</span>
            </div>
            <div className="flex gap-3.5 overflow-x-auto pb-2 px-1 scrollbar-hide snap-x">
              {product.imageUrls.map((url, idx) => (
                <button key={idx} onClick={() => setActiveImage(idx)} className={`relative w-24 md:w-36 h-16 md:h-24 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 snap-start ${activeImage === idx ? 'border-white scale-[1.05] shadow-[0_0_20px_rgba(255,255,255,0.1)] z-10' : 'border-white/5 opacity-40 hover:opacity-80'}`}>
                  <img src={url} className="w-full h-full object-cover" alt={`Preview ${idx + 1}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 md:gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-[0.2em] text-blue-400 font-black px-3 py-1 bg-blue-400/10 border border-blue-400/20 rounded-lg">
                {product.category}
              </span>
              {product.isCustom && (
                <span className="text-[10px] uppercase tracking-[0.2em] text-purple-400 font-black px-3 py-1 bg-purple-400/10 border border-purple-400/20 rounded-lg">
                  Custom Software
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter uppercase italic leading-[0.85] text-white">
              {product.name}
            </h1>
            <div className="flex items-center gap-6 py-2">
              <span className="text-4xl md:text-6xl font-mono text-green-400 font-black tracking-tighter leading-none">
                ${calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>

          <div className="text-zinc-400 leading-relaxed text-sm md:text-base font-medium max-w-lg">
            {product.description}
          </div>

          {(product.hosting?.enabled || product.customDomain?.enabled || product.inboxAddon?.enabled) && (
            <div className="space-y-4 p-6 md:p-8 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl">
              <h3 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-zinc-600 flex items-center gap-3">
                <Server className="w-4 h-4" /> Deployment Modules
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {product.hosting?.enabled && (
                  <button onClick={() => setIncludeHosting(!includeHosting)} className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 gap-2 ${includeHosting ? 'bg-white border-white text-black shadow-lg translate-y-[-2px]' : 'bg-black/40 border-white/5 text-zinc-500 hover:border-white/20'}`}>
                    <Cloud className="w-4 h-4" />
                    <div className="text-center"><p className="text-[9px] md:text-[10px] font-black uppercase leading-none">Cloud</p><p className="text-[8px] font-mono mt-1">+${product.hosting.price}</p></div>
                  </button>
                )}
                {product.customDomain?.enabled && (
                  <button onClick={() => setIncludeDomain(!includeDomain)} className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 gap-2 ${includeDomain ? 'bg-white border-white text-black shadow-lg translate-y-[-2px]' : 'bg-black/40 border-white/5 text-zinc-500 hover:border-white/20'}`}>
                    <Globe className="w-4 h-4" />
                    <div className="text-center"><p className="text-[9px] md:text-[10px] font-black uppercase leading-none">Domain</p><p className="text-[8px] font-mono mt-1">+${product.customDomain.price}</p></div>
                  </button>
                )}
                {product.inboxAddon?.enabled && (
                  <button onClick={() => setIncludeInbox(!includeInbox)} className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 gap-2 ${includeInbox ? 'bg-white border-white text-black shadow-lg translate-y-[-2px]' : 'bg-black/40 border-white/5 text-zinc-500 hover:border-white/20'}`}>
                    <Mail className="w-4 h-4" />
                    <div className="text-center"><p className="text-[9px] md:text-[10px] font-black uppercase leading-none">Inbox</p><p className="text-[8px] font-mono mt-1">+${product.inboxAddon.price}</p></div>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <button onClick={handleAddToCart} className={`group flex items-center justify-center gap-4 py-5 md:py-7 rounded-2xl md:rounded-full font-black uppercase tracking-[0.2em] text-xs md:text-sm transition-all duration-500 shadow-2xl ${added ? 'bg-green-500 text-white' : 'bg-white text-black hover:scale-[1.02] active:scale-95'}`}>
              {added ? <Check className="w-5 h-5 animate-in zoom-in" /> : <ShieldCheck className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
              {added ? 'Deployed to Cart' : 'Acquire Module'}
            </button>
            {product.previewUrl && (
              <a href={product.previewUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 px-8 py-5 border border-white/10 bg-zinc-900/40 backdrop-blur-2xl rounded-2xl md:rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                Live Module Preview <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
             <div className="p-5 bg-[#080808] border border-white/5 rounded-xl flex items-center gap-4">
               <Code className="w-5 h-5 text-blue-500" />
               <div>
                 <h4 className="text-[10px] font-black uppercase text-zinc-300 tracking-widest leading-none">Source Code</h4>
                 <p className="text-[8px] font-bold text-zinc-600 uppercase mt-1.5">Clean Architect</p>
               </div>
             </div>
             <div className="p-5 bg-[#080808] border border-white/5 rounded-xl flex items-center gap-4">
               <BookOpen className="w-5 h-5 text-green-500" />
               <div>
                 <h4 className="text-[10px] font-black uppercase text-zinc-300 tracking-widest leading-none">Educational</h4>
                 <p className="text-[8px] font-bold text-zinc-600 uppercase mt-1.5">Tutorial Included</p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
