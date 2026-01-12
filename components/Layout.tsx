
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ChevronRight, 
  ChevronDown,
  LayoutDashboard,
  PackageCheck,
  Settings,
  Cloud,
  Globe,
  Mail,
  Home as HomeIcon,
  Archive,
  MessageSquare,
  Activity,
  ShieldAlert
} from 'lucide-react';
import { useAppContext } from '../AppContext';

const LOGO_URL = "https://i.postimg.cc/HxbV8zdK/techmanship-logo.png";

export const Header: React.FC<{ onOpenCart: () => void }> = ({ onOpenCart }) => {
  const { user, setUser, cart, settings } = useAppContext();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setIsProfileOpen(false);
    navigate('/');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-20 md:h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src={LOGO_URL} 
              alt="Techmanship Logo" 
              className="w-10 h-10 md:w-8 md:h-8 object-contain group-hover:scale-110 transition-transform duration-500" 
            />
            <span className="uppercase tracking-tighter font-black text-xl md:text-lg hidden sm:inline">{settings.appName}</span>
          </Link>
        </div>

        <div className="flex items-center gap-4 md:gap-3">
          {!user?.isSuspended && (
            <button onClick={onOpenCart} className="relative p-3 md:p-2.5 hover:bg-zinc-900 rounded-full transition-colors">
              <ShoppingCart className="w-6 h-6 md:w-5 md:h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 md:top-1.5 md:right-1.5 bg-white text-black text-[10px] md:text-[9px] font-black w-5 h-5 md:w-4 md:h-4 rounded-full flex items-center justify-center ring-2 ring-black">
                  {cartCount}
                </span>
              )}
            </button>
          )}
          
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)} 
              className={`flex items-center gap-2.5 p-2 px-4 md:p-1.5 md:px-3 rounded-full border border-white/10 transition-all active:scale-95 ${user?.isSuspended ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20' : 'bg-zinc-900/50 hover:bg-zinc-900'}`}
            >
              {user?.isSuspended ? <ShieldAlert className="w-5 h-5 md:w-4 md:h-4" /> : <User className="w-5 h-5 md:w-4 md:h-4" />}
              <span className="text-sm md:text-xs font-black uppercase tracking-widest hidden sm:inline">
                {user ? user.displayName.split(' ')[0] : 'Menu'}
              </span>
              <ChevronDown className={`w-4 h-4 md:w-3 md:h-3 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-72 md:w-64 bg-zinc-950 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden py-3 md:py-2 animate-in fade-in zoom-in-95 duration-200">
                {user && (
                  <div className={`px-5 py-4 md:px-4 md:py-3 border-b border-white/5 mb-2 ${user.isSuspended ? 'bg-red-500/5' : ''}`}>
                    <p className={`text-[11px] md:text-[10px] font-black uppercase tracking-[0.2em] ${user.isSuspended ? 'text-red-500' : 'text-zinc-500'}`}>
                      {user.isSuspended ? 'Banned Operator' : 'Authorized Operator'}
                    </p>
                    <p className="text-base md:text-sm font-black truncate text-white">{user.displayName}</p>
                  </div>
                )}

                <div className="space-y-1.5 md:space-y-1 px-3 md:px-2">
                  {!user?.isSuspended && (
                    <>
                      <Link to="/" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-4 md:gap-3 px-4 py-4 md:px-3 md:py-3 text-sm md:text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl font-black uppercase tracking-widest transition-all">
                        <HomeIcon className="w-5 h-5 md:w-4 md:h-4" /> Home
                      </Link>
                      <Link to="/templates" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-4 md:gap-3 px-4 py-4 md:px-3 md:py-3 text-sm md:text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl font-black uppercase tracking-widest transition-all">
                        <Archive className="w-5 h-5 md:w-4 md:h-4" /> Catalog
                      </Link>
                    </>
                  )}
                  <Link to="/contact" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-4 md:gap-3 px-4 py-4 md:px-3 md:py-3 text-sm md:text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl font-black uppercase tracking-widest transition-all">
                    <MessageSquare className="w-5 h-5 md:w-4 md:h-4" /> {user?.isSuspended ? 'Appeal Suspension' : 'Contact Support'}
                  </Link>
                </div>

                <div className="my-2.5 border-t border-white/5" />

                <div className="space-y-1.5 md:space-y-1 px-3 md:px-2">
                  {!user ? (
                    <Link to="/login" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-4 md:gap-3 px-4 py-4 md:px-3 md:py-3 text-sm md:text-xs bg-white text-black hover:bg-zinc-200 rounded-xl font-black uppercase tracking-widest transition-all">
                      <User className="w-5 h-5 md:w-4 md:h-4" /> Login / Join
                    </Link>
                  ) : (
                    <>
                      {!user.isSuspended && (
                        <Link to="/dashboard" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-4 md:gap-3 px-4 py-4 md:px-3 md:py-3 text-sm md:text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl font-black uppercase tracking-widest transition-all">
                          <Activity className="w-5 h-5 md:w-4 md:h-4" /> Dashboard
                        </Link>
                      )}
                      {user.isAdmin && !user.isSuspended && (
                        <Link to="/admin" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-4 md:gap-3 px-4 py-4 md:px-3 md:py-3 text-sm md:text-xs text-blue-400 hover:bg-blue-400/10 rounded-xl font-black uppercase tracking-widest transition-all">
                          <LayoutDashboard className="w-5 h-5 md:w-4 md:h-4" /> Admin Console
                        </Link>
                      )}
                      <button onClick={handleLogout} className="w-full flex items-center gap-4 md:gap-3 px-4 py-4 md:px-3 md:py-3 text-sm md:text-xs text-red-500 hover:bg-red-500/10 rounded-xl font-black uppercase tracking-widest transition-all text-left">
                        <LogOut className="w-5 h-5 md:w-4 md:h-4" /> Terminate Session
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export const Footer = () => {
  const { settings, user } = useAppContext();
  return (
    <footer className="border-t border-white/5 py-12 bg-black">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src={LOGO_URL} className="w-6 h-6 object-contain" alt="" />
              <h3 className="text-sm font-black uppercase tracking-widest">{settings.appName}</h3>
            </div>
            <p className="text-zinc-500 text-xs max-w-xs leading-relaxed uppercase tracking-tight font-medium">{settings.seoDescription}</p>
          </div>
          <div>
            <h4 className="font-black mb-4 text-[10px] uppercase tracking-widest text-zinc-400">Navigation</h4>
            <ul className="space-y-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              {!user?.isSuspended && (
                <li><Link to="/templates" className="hover:text-white transition-colors">Catalog</Link></li>
              )}
              <li><Link to="/contact" className="hover:text-white transition-colors">{user?.isSuspended ? 'Appeal' : 'Custom Build'}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black mb-4 text-[10px] uppercase tracking-widest text-zinc-400">Communication</h4>
            <ul className="space-y-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              <li><a href="https://t.me/techmanship" className="hover:text-white transition-colors">Telegram</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-white/5 text-center text-[9px] font-black text-zinc-600 uppercase tracking-[0.5em]">
          &copy; {new Date().getFullYear()} {settings.appName} • Terminal Status: {user?.isSuspended ? 'Locked' : 'Online'}
        </div>
      </div>
    </footer>
  );
};

export const CartSheet: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, updateQuantity, cartTotal, user } = useAppContext();
  const navigate = useNavigate();

  if (!isOpen || user?.isSuspended) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[360px] h-full bg-zinc-950 border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black">
          <h2 className="text-sm font-black uppercase tracking-[0.2em]">Asset Vault ({cart.length})</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-2 italic text-xs uppercase tracking-widest">
              <ShoppingCart className="w-8 h-8 opacity-20 mb-2" />
              <p>Vault is empty</p>
            </div>
          ) : (
            cart.map((item: any) => (
              <div key={item.configId} className="flex flex-col gap-3 p-3 rounded-2xl border border-white/5 bg-zinc-900/40">
                <div className="flex gap-4">
                  <img src={item.imageUrls[0]} className="w-16 h-16 object-cover rounded-xl border border-white/5" alt="" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-black uppercase truncate leading-tight mb-1">{item.name}</h4>
                    <p className="text-[10px] font-mono font-black text-green-500">${item.price.toFixed(2)}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center border border-white/10 rounded-lg bg-black">
                        <button onClick={() => updateQuantity(item.configId, item.quantity - 1)} className="p-1 px-2 hover:bg-white/5 text-xs"><Minus className="w-3 h-3" /></button>
                        <span className="text-[10px] font-black px-2">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.configId, item.quantity + 1)} className="p-1 px-2 hover:bg-white/5 text-xs"><Plus className="w-3 h-3" /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.configId)} className="text-red-500 p-2 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
                {(item.selectedHosting || item.selectedDomain || item.selectedInbox) && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.selectedHosting && (
                      <span className="text-[8px] font-black uppercase bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md border border-blue-500/20 flex items-center gap-1">
                        <Cloud className="w-2.5 h-2.5" /> Cloud
                      </span>
                    )}
                    {item.selectedDomain && (
                      <span className="text-[8px] font-black uppercase bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-md border border-purple-500/20 flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5" /> DNS
                      </span>
                    )}
                    {item.selectedInbox && (
                      <span className="text-[8px] font-black uppercase bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-md border border-orange-500/20 flex items-center gap-1">
                        <Mail className="w-2.5 h-2.5" /> Inbox
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="p-4 border-t border-white/10 bg-black">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Total Value</span>
              <span className="text-lg font-mono font-black text-green-400">${cartTotal.toFixed(2)}</span>
            </div>
            <button 
              onClick={() => { navigate(user ? '/checkout' : '/login'); onClose(); }} 
              className="w-full bg-white text-black py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-xl"
            >
              Initialize Transfer <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
