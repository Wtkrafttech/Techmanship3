
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, ShieldCheck, ChevronRight, Calculator, RefreshCw } from 'lucide-react';
import { useAppContext } from '../AppContext';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { sendTelegramNotification } from '../lib/notifications';
import { useToast } from '../components/Toast';

const LOGO_URL = "https://i.postimg.cc/HxbV8zdK/techmanship-logo.png";

export const Auth = () => {
  const { setUser, settings } = useAppContext();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = location.pathname === '/login';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Math Protection State
  const [mathChallenge, setMathChallenge] = useState({ a: 0, b: 0, result: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const generateChallenge = () => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    setMathChallenge({ a, b, result: a + b });
    setUserAnswer('');
    setIsVerified(false);
  };

  useEffect(() => {
    generateChallenge();
  }, [location.pathname]);

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserAnswer(val);
    if (parseInt(val) === mathChallenge.result) {
      setIsVerified(true);
    } else {
      setIsVerified(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      showToast('warning', 'SECURITY PROTOCOL: MATHEMATICAL VERIFICATION REQUIRED.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        showToast('success', 'ACCESS GRANTED. INITIALIZING SESSION.');
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: email,
          displayName: name,
          isAdmin: false,
          createdAt: serverTimestamp()
        });

        const config = (settings as any).telegram;
        if (config?.botToken && config?.chatId) {
          sendTelegramNotification(
            config.botToken, 
            config.chatId, 
            `<b>[NEW OPERATOR JOINED]</b>\nAlias: ${name}\nEmail: ${email}\nUID: ${userCredential.user.uid.slice(0,8)}`
          );
        }
        showToast('success', 'OPERATOR CREATED. WELCOME TO THE REPOSITORY.');
      }

      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const profileData = userDoc.exists() ? userDoc.data() : null;

      const userData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email || '',
        displayName: profileData?.displayName || userCredential.user.displayName || 'User',
        isAdmin: profileData?.isAdmin || false
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      navigate('/dashboard');
      
    } catch (err: any) {
      console.error(err);
      const msg = err.message || 'Authentication failed';
      setError(msg);
      showToast('error', `AUTHORIZATION DENIED: ${msg.toUpperCase()}`);
      generateChallenge();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-6">
      <div className="w-full max-sm:max-w-sm max-w-sm">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-[2rem] mx-auto flex items-center justify-center mb-4 shadow-xl">
            <img src={LOGO_URL} alt="Techmanship Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase italic">{isLogin ? 'Authorization' : 'Access Request'}</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">{isLogin ? 'Sign in to repository' : 'Initialize operator account'}</p>
        </div>
        <div className="bg-card border border-white/5 rounded-[2.5rem] p-6 shadow-2xl">
          {error && (<div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-black uppercase rounded-xl text-center">{error}</div>)}
          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (<div className="space-y-1"><label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Alias</label><div className="relative group"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-white transition-colors" /><input required type="text" placeholder="John Doe" className="w-full bg-background border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold focus:outline-none focus:border-white/20 transition-all" value={name} onChange={(e) => setName(e.target.value)} /></div></div>)}
            <div className="space-y-1"><label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Credential (Email)</label><div className="relative group"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-white transition-colors" /><input required type="email" placeholder="name@nexus.com" className="w-full bg-background border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold focus:outline-none focus:border-white/20 transition-all" value={email} onChange={(e) => setEmail(e.target.value)} /></div></div>
            <div className="space-y-1"><div className="flex items-center justify-between ml-1"><label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Access Key</label>{isLogin && <button type="button" className="text-[8px] font-black uppercase text-zinc-500 hover:text-white transition-colors">Forgot Key?</button>}</div><div className="relative group"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-white transition-colors" /><input required type="password" placeholder="••••••••" className="w-full bg-background border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold focus:outline-none focus:border-white/20 transition-all" value={password} onChange={(e) => setPassword(e.target.value)} /></div></div>
            
            {/* Mathematical Bot Protection Module */}
            <div className="pt-4 pb-2">
              <div className={`relative p-4 rounded-xl border transition-all duration-300 ${isVerified ? 'bg-green-500/10 border-green-500/30' : 'bg-black/40 border-white/5'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calculator className={`w-3.5 h-3.5 ${isVerified ? 'text-green-500' : 'text-zinc-500'}`} />
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isVerified ? 'text-green-500' : 'text-zinc-500'}`}>
                      {isVerified ? 'Clearance Confirmed' : 'Neural Verification'}
                    </span>
                  </div>
                  {!isVerified && (
                    <button type="button" onClick={generateChallenge} className="text-zinc-600 hover:text-white transition-colors">
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-zinc-950 border border-white/5 rounded-lg py-3 px-4 text-center font-mono text-sm font-black text-white">
                    {mathChallenge.a} + {mathChallenge.b} = ?
                  </div>
                  <div className="w-24 relative">
                    <input 
                      type="number"
                      placeholder="Answer"
                      value={userAnswer}
                      onChange={handleAnswerChange}
                      disabled={isVerified}
                      className={`w-full bg-zinc-950 border rounded-lg py-3 px-3 text-center text-sm font-black transition-all outline-none ${
                        isVerified ? 'border-green-500 text-green-500' : 'border-white/10 text-white focus:border-white/20'
                      }`}
                    />
                    {isVerified && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-black rounded-full p-0.5 animate-in zoom-in duration-300">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button 
              disabled={loading || !isVerified} 
              type="submit" 
              className={`w-full py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 mt-2 shadow-xl ${
                !isVerified 
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                  : 'bg-white text-black hover:scale-[1.02] active:scale-95'
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>{isLogin ? 'Initialize Session' : 'Create Operator'} <ArrowRight className="w-3 h-3" /></>
              )}
            </button>
          </form>
        </div>
        <p className="text-center mt-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{isLogin ? "No Clearance?" : "Existing Operator?"}{' '}<Link to={isLogin ? '/signup' : '/login'} className="text-white hover:underline ml-1">{isLogin ? 'Join Hub' : 'Enter Hub'}</Link></p>
      </div>
    </div>
  );
};
