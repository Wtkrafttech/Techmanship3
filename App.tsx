
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AppProvider, useAppContext } from './AppContext';
import { Header, Footer, CartSheet } from './components/Layout';
import { Home } from './pages/Home';
import { Templates } from './pages/Templates';
import { ProductDetail } from './pages/ProductDetail';
import { Auth } from './pages/Auth';
import { Checkout } from './pages/Checkout';
import { Contact } from './pages/Contact';
import { AdminDashboard } from './pages/Admin';
import { Dashboard } from './pages/Dashboard';
import { Loader2, Terminal, Shield, Activity, AlertCircle, LogOut, MessageSquare, Send } from 'lucide-react';

const LOGO_URL = "https://i.postimg.cc/HxbV8zdK/techmanship-logo.png";

const SuspendedScreen = () => {
  const { setUser, settings } = useAppContext();
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };
  
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
      <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
        <AlertCircle className="w-12 h-12 text-red-500" />
      </div>
      <h1 className="text-4xl font-black uppercase italic mb-4 tracking-tighter text-white">Access Revoked</h1>
      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] max-w-sm mb-12 leading-relaxed">
        Your security clearance has been terminated by System Command. 
        Access to the digital arsenal and repository is strictly prohibited.
      </p>
      
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <a 
          href="https://t.me/techmanship" 
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 bg-white text-black py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
        >
          <Send className="w-4 h-4" /> Contact Command on Telegram
        </a>
        <button 
          onClick={handleLogout} 
          className="flex items-center justify-center gap-2 text-[10px] font-black uppercase text-zinc-600 hover:text-white transition-colors mt-4"
        >
          <LogOut className="w-3 h-3" /> Terminate Session
        </button>
      </div>
      
      <div className="absolute bottom-12 text-[8px] font-black uppercase text-zinc-800 tracking-[1em]">
        Status: Locked • Protocol: Alpha-X
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isInitialLoading } = useAppContext();
  if (isInitialLoading) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.isSuspended) return <SuspendedScreen />;
  return <>{children}</>;
};

const ProtectedAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isInitialLoading } = useAppContext();
  if (isInitialLoading) return null;
  if (!user?.isAdmin) return <Navigate to="/" />;
  if (user.isSuspended) return <SuspendedScreen />;
  return <>{children}</>;
};

const PageLoader = () => {
  const { isInitialLoading, isMediaReady, settings, setMediaReady } = useAppContext();
  const [show, setShow] = useState(true);
  const [status, setStatus] = useState("Establishing Connection...");
  const videoRef = useRef<HTMLVideoElement>(null);

  const hero = settings.hero;
  const finalVideoUrl = (hero as any).videoUrl || hero.backgroundUrl;
  const isYoutube = hero.backgroundType === 'video' && finalVideoUrl && (finalVideoUrl.includes('youtube.com') || finalVideoUrl.includes('youtu.be') || finalVideoUrl.length === 11);

  useEffect(() => {
    if (!isInitialLoading) {
      const timer = setTimeout(() => setStatus("Syncing Digital Arsenal..."), 500);
      const failSafe = setTimeout(() => setMediaReady(true), 3500);
      return () => { clearTimeout(timer); clearTimeout(failSafe); };
    }
  }, [isInitialLoading]);

  useEffect(() => {
    if (!isInitialLoading && isMediaReady) {
      setStatus("Protocol Authorized.");
      const timer = setTimeout(() => setShow(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isInitialLoading, isMediaReady]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {hero.backgroundType === 'video' && !isInitialLoading && finalVideoUrl && (
          <div className="w-full h-full relative opacity-20">
            {isYoutube ? (
              <div className="absolute top-1/2 left-1/2 w-[300%] h-[100%] md:w-[120vw] md:h-[120vh] -translate-x-1/2 -translate-y-1/2">
                <iframe 
                  className="w-full h-full object-cover pointer-events-none scale-[1.5] md:scale-110 grayscale" 
                  src={`https://www.youtube.com/embed/${finalVideoUrl.split('v=')[1] || finalVideoUrl}?autoplay=1&mute=1&loop=1&playlist=${finalVideoUrl.split('v=')[1] || finalVideoUrl}&controls=0&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3&enablejsapi=1&playsinline=1`} 
                  frameBorder="0" 
                ></iframe>
              </div>
            ) : (
              <video 
                ref={videoRef} autoPlay muted loop playsInline onPlaying={() => setMediaReady(true)}
                className="absolute top-1/2 left-1/2 w-full h-full min-w-full min-h-full -translate-x-1/2 -translate-y-1/2 object-cover grayscale"
              >
                <source src={finalVideoUrl} type="video/mp4" />
              </video>
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-black/90" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative">
          <div className="w-28 h-28 border border-white/10 rounded-full flex items-center justify-center animate-spin duration-[4s]">
            <div className="w-20 h-20 border border-white/20 rounded-full animate-pulse" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <img src={LOGO_URL} className="w-12 h-12 object-contain animate-pulse" alt="Logo" />
          </div>
        </div>
        <div className="mt-8 text-center space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-white">{settings.appName}</h2>
          <div className="flex flex-col items-center gap-1">
            <p className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">{status}</p>
            <div className="w-48 h-0.5 bg-zinc-900 rounded-full overflow-hidden mt-2">
              <div className={`h-full bg-white transition-all duration-1000 ease-out ${!isInitialLoading ? (isMediaReady ? 'w-full' : 'w-1/2') : 'w-0'}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user } = useAppContext();

  // Global suspension guard
  if (user?.isSuspended) {
    return (
      <div className="min-h-screen bg-black">
        <SuspendedScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PageLoader />
      <Header onOpenCart={() => setIsCartOpen(true)} />
      <CartSheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
          <Route path="/product/:slug" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
          <Route path="/login" element={<Auth />} />
          <Route path="/signup" element={<Auth />} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<ProtectedAdmin><AdminDashboard /></ProtectedAdmin>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
};

export default App;
