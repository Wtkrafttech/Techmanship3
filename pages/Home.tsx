
import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Zap, Shield, Globe, Terminal, Mail, Server, 
  Search, Loader2, Code, Cpu, Activity, Database, Lock, 
  MessageSquare, Layers, ChevronRight, FileCode, Workflow, GraduationCap,
  MousePointer2, Share2, Rocket, Newspaper, BookOpen
} from 'lucide-react';
import { useAppContext } from '../AppContext';
import { db } from '../lib/firebase';
import { collection, query, limit, getDocs, where } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { Product, Category } from '../types';
import { updatePageTitle } from '../lib/utils';

const PROMO_PHRASES = [
  "NEW SCRIPTS DEPLOYED • 2025",
  "HTML5 SINGLE PAGE MODULES",
  "AUTOMATION & SCRAPER TOOLS",
  "API INTEGRATED SYSTEMS",
  "CLEAN SOURCE CODE STANDARDS",
  "PREBUILT TECH ARCHITECTURE",
  "MASTERCLASS TUTORIALS",
  "MASS SENDER PROTOCOLS",
  "DEVELOPER COMMUNITY UPDATES",
  "SCALE YOUR INFRASTRUCTURE"
];

export const Home = () => {
  const { settings, isInitialLoading, setMediaReady, user } = useAppContext();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const hero = settings.hero;

  useEffect(() => {
    updatePageTitle('Premium Tech Scripts & Software Solutions');
    const fetchContent = async () => {
      try {
        const cSnap = await getDocs(query(collection(db, 'categories'), where('hidden', '==', false)));
        setCategories(cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
      } catch (err) { 
        console.error("Content fetch failed:", err); 
      } finally { 
        setLoadingContent(false); 
      }
    };
    fetchContent();
  }, []);

  useEffect(() => {
    if (hero.backgroundType === 'image') {
      const finalImageUrl = (hero as any).imageUrl || hero.backgroundUrl;
      if (!finalImageUrl) {
        setMediaReady(true);
        return;
      }
      const img = new Image();
      img.src = finalImageUrl;
      img.onload = () => setMediaReady(true);
      img.onerror = () => setMediaReady(true);
    } else if (hero.backgroundType === 'video') {
       const finalVideoUrl = (hero as any).videoUrl || hero.backgroundUrl;
       if (!finalVideoUrl) setMediaReady(true);
    }
  }, [hero.backgroundType, hero.backgroundUrl, setMediaReady]);

  useEffect(() => {
    const finalVideoUrl = (hero as any).videoUrl || hero.backgroundUrl;
    if (!finalVideoUrl) return;
    const isYoutube = hero.backgroundType === 'video' && (finalVideoUrl.includes('youtube.com') || finalVideoUrl.includes('youtu.be') || finalVideoUrl.length === 11);
    
    if (isYoutube) {
      const handleMessage = (e: MessageEvent) => {
        if (typeof e.data === 'string' && e.data.includes('infoDelivery') && e.data.includes('"info":2')) {
          setMediaReady(true);
        }
      };
      window.addEventListener('message', handleMessage);
      const safety = setTimeout(() => setMediaReady(true), 3000);
      return () => {
        window.removeEventListener('message', handleMessage);
        clearTimeout(safety);
      };
    }
  }, [hero.backgroundType, hero.backgroundUrl, setMediaReady]);

  const getYoutubeId = (url: string) => {
    if (!url) return '';
    if (url.length === 11) return url;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    return (match && match[2].length === 11) ? match[2] : url;
  };

  const finalImageUrl = (hero as any).imageUrl || hero.backgroundUrl;
  const finalVideoUrl = (hero as any).videoUrl || hero.backgroundUrl;
  const isYoutube = hero.backgroundType === 'video' && finalVideoUrl && (finalVideoUrl.includes('youtube.com') || finalVideoUrl.includes('youtu.be') || finalVideoUrl.length === 11);
  const videoId = isYoutube ? getYoutubeId(finalVideoUrl) : '';

  return (
    <div className="flex flex-col gap-0 bg-[#050505] text-zinc-100">
      {/* Hero Section */}
      <section className="relative min-h-[65vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden border-b border-white/5 py-12 md:py-24">
        <div className="absolute inset-0 z-0 bg-black">
          {hero.backgroundType === 'video' && finalVideoUrl ? (
            <div className="w-full h-full relative overflow-hidden pointer-events-none">
              {isYoutube ? (
                <div className="absolute top-1/2 left-1/2 w-[300%] h-[100%] md:w-[120vw] md:h-[120vh] -translate-x-1/2 -translate-y-1/2">
                  <iframe 
                    className="w-full h-full object-cover opacity-100 pointer-events-none scale-[1.5] md:scale-110" 
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3&enablejsapi=1&playsinline=1`} 
                    frameBorder="0" 
                    allow="autoplay; encrypted-media; fullscreen"
                    title="Hero Video"
                  ></iframe>
                </div>
              ) : (
                <video 
                  ref={videoRef} autoPlay muted loop playsInline onPlaying={() => setMediaReady(true)}
                  className="absolute top-1/2 left-1/2 w-full h-full min-w-full min-h-full -translate-x-1/2 -translate-y-1/2 object-cover opacity-100"
                >
                  <source src={finalVideoUrl} type="video/mp4" />
                </video>
              )}
            </div>
          ) : hero.backgroundType === 'image' && finalImageUrl ? ( 
            <img src={finalImageUrl} className="w-full h-full object-cover opacity-100" alt="" /> 
          ) : (
            <div className="w-full h-full bg-black" />
          )}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#050505_100%)] opacity-80" />
        </div>
        
        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            {/* Horizontal Rolling Marquee */}
            <div className="relative w-full max-w-[280px] md:max-w-md mx-auto mb-8 overflow-hidden bg-black/60 backdrop-blur-xl border border-white/10 rounded-full py-2.5 shadow-2xl">
              <div className="flex animate-marquee whitespace-nowrap items-center">
                {[...PROMO_PHRASES, ...PROMO_PHRASES].map((phrase, idx) => (
                  <React.Fragment key={idx}>
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white px-4">
                      {phrase}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-white/20 mx-2" />
                  </React.Fragment>
                ))}
              </div>
            </div>

            <h1 className="text-4xl md:text-7xl font-black tracking-tight mb-4 uppercase italic leading-[0.9] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] text-white">{hero.headline}</h1>
            <p className="text-base md:text-lg text-zinc-100 max-w-xl mx-auto mb-8 leading-snug font-medium">Acquire production-ready web scripts, automation software, HTML templates, and advanced tech tutorials to scale your operations.</p>
            <div className="flex flex-row gap-2 justify-center items-center">
              <Link to={user ? "/templates" : "/login"} className="bg-white text-black px-12 py-5 rounded-full text-sm font-black hover:scale-105 transition-all flex items-center gap-2 uppercase shadow-xl">
                {user ? "Enter Repository" : "Request Access"} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Centralized Statistics Bar - REDUCED PADDING */}
      <div className="w-full bg-black border-y border-white/5 py-6 md:py-10">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: 'Scripts', value: '8,500+', icon: FileCode },
            { label: 'Automation', value: 'Active Tools', icon: Workflow },
            { label: 'Education', value: 'Live Tutorials', icon: GraduationCap },
            { label: 'Uptime', value: '99.9% Core', icon: Activity }
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center text-center p-6 md:p-8 rounded-[2rem] bg-white/[0.03] backdrop-blur-xl border border-white/10 ring-1 ring-white/5 shadow-2xl transition-all hover:bg-white/[0.05] hover:border-white/20 group">
              <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 mb-4 group-hover:scale-110 transition-transform">
                <stat.icon className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] leading-none mb-3">{stat.label}</div>
                <div className="font-mono font-black text-sm md:text-lg text-white leading-none tracking-tight">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Classifications Section - REDUCED TOP MARGIN */}
      <section className="container mx-auto px-4 pt-8 pb-16 md:pt-12 md:pb-24">
        {/* Centralized Category Header */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
            <Layers className="w-4 h-4 text-white/40" />
            <span className="text-[11px] font-black text-white/60 uppercase tracking-[0.3em]">Module Index</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white">Tech Classifications</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10 md:mb-14">
          {loadingContent ? [1,2,3,4,5,6].map(i => <div key={i} className="h-24 rounded-2xl bg-zinc-900 animate-pulse" />) :
          categories.map(cat => (
            <Link key={cat.id} to={user ? `/templates?category=${cat.name}` : "/login"} className="group flex items-center gap-5 bg-[#0a0a0a] border border-white/5 p-4 rounded-2xl hover:border-white/20 transition-all hover:bg-zinc-900/40">
              <div className="relative w-16 h-12 flex-shrink-0 bg-black rounded-xl overflow-hidden border border-white/10">
                <img src={cat.imageUrl} className="w-full h-full object-cover opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" alt={cat.name} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-black uppercase italic text-white group-hover:text-green-500 transition-colors tracking-tight leading-tight">{cat.name}</h3>
                <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mt-1">Sync Registry</p>
              </div>
              <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                <ChevronRight className="w-5 h-5" />
              </div>
            </Link>
          ))}
        </div>

        {/* Centralized Module Feature Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12 py-12 md:py-20 border-t border-white/5">
          {[
            { 
              title: "Prebuilt Scripts", 
              desc: "Complete backend architectures and single-page HTML5 modules ready for immediate deployment.",
              icon: Terminal,
              tags: ["PHP", "NODEJS", "HTML5"]
            },
            { 
              title: "Automation Hub", 
              desc: "High-performance scrapers, mass senders, and specialized API automation tools.",
              icon: Zap,
              tags: ["SCRAPERS", "SENDERS", "BOTS"]
            },
            { 
              title: "Tech Education", 
              desc: "Step-by-step masterclass tutorials focusing on security, automation, and full-stack development.",
              icon: BookOpen,
              tags: ["COURSES", "GUIDES", "PDF"]
            },
            { 
              title: "Community Log", 
              desc: "Real-time work updates, community signals, and collaborative tech insights.",
              icon: Share2,
              tags: ["FEED", "SIGNAL", "UPDATES"]
            }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <item.icon className="w-5 h-5 text-white/60" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xs md:text-sm font-black uppercase italic tracking-widest leading-tight text-white">{item.title}</h3>
                <p className="text-zinc-500 text-[11px] md:text-xs leading-relaxed font-medium uppercase tracking-tight max-w-[180px] mx-auto line-clamp-3">{item.desc}</p>
              </div>
              <div className="flex flex-wrap gap-2 pt-1 justify-center">
                {item.tags.map(t => (
                  <span key={t} className="text-[9px] font-black text-zinc-600 border border-white/5 px-2 py-0.5 rounded-md hover:text-white hover:border-white/20 transition-colors">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-black py-12 md:py-16 border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="md:col-span-2 p-8 md:p-12 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] group hover:bg-zinc-900 transition-all">
              <div className="flex items-center gap-5 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Terminal className="w-6 h-6" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black uppercase italic tracking-tight">Advanced Automation Units</h3>
              </div>
              <p className="text-zinc-500 text-base leading-relaxed max-w-xl">Specialized scraper modules, mass sender protocols, and automation tools engineered for high-volume data operations. Optimized for speed and security across all digital environments.</p>
              <div className="mt-8 flex items-center gap-4">
                 <div className="h-0.5 w-12 bg-blue-500/30" />
                 <span className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Code Verified Units</span>
              </div>
            </div>
            <div className="p-8 md:p-12 bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] hover:bg-zinc-900 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-6">
                  <Newspaper className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black mb-3 uppercase italic tracking-tight">Community Signals</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">Stay updated with our real-time community log. Get work updates, feature releases, and technical breakthroughs directly in your feed.</p>
              </div>
              {!user && (
                <div className="mt-8">
                  <Link to="/login" className="text-[11px] font-black uppercase tracking-widest flex items-center gap-3 text-white">
                    Unlock Feed <Lock className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="relative p-12 md:p-16 bg-white text-black rounded-[3rem] md:rounded-[4rem] overflow-hidden text-center shadow-2xl">
          <div className="absolute top-0 right-0 p-10 opacity-10">
            <Terminal className="w-24 h-24 md:w-32 md:h-32" />
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-4 uppercase tracking-tight italic leading-tight">Scale Your Operations</h2>
          <p className="text-sm font-bold mb-8 md:mb-10 text-black/60 uppercase tracking-[0.3em]">Verified Source Code • Automation Hub • Developer Community Updates</p>
          <Link to={user ? "/templates" : "/login"} className="inline-block bg-black text-white px-12 py-5 rounded-full text-sm font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl">
             {user ? "View All Modules" : "Join Repository"}
          </Link>
        </div>
      </section>
    </div>
  );
};
