
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, CartItem, Product, HeroSettings, PaymentSettings, Order } from './types';
import { MOCK_HERO, MOCK_PAYMENT } from './mockData';
import { db, auth } from './lib/firebase';
import { doc, getDoc, onSnapshot, collection, query, where, orderBy } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

interface ExtendedHeroSettings extends HeroSettings {
  imageUrl?: string;
  videoUrl?: string;
}

interface AppSettings {
  appName: string;
  seoDescription: string;
  primaryColor: string;
  hero: ExtendedHeroSettings;
  gateways: PaymentSettings[];
  payment: PaymentSettings; // Legacy fallback
  telegram?: {
    botToken: string;
    chatId: string;
  };
}

export interface ConfiguredCartItem extends CartItem {
  selectedHosting?: boolean;
  selectedDomain?: boolean;
  selectedInbox?: boolean;
  basePrice: number;
  configId: string;
}

interface AppContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  cart: ConfiguredCartItem[];
  addToCart: (product: Product, options?: { hosting?: boolean; domain?: boolean; inbox?: boolean }) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  settings: AppSettings;
  updateSettings: (newSettings: AppSettings) => void;
  isInitialLoading: boolean;
  isMediaReady: boolean;
  setMediaReady: (ready: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [cart, setCart] = useState<ConfiguredCartItem[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isMediaReady, setIsMediaReady] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    appName: 'TECHMANSHIP',
    seoDescription: 'Premium Web Scripts, Software Automation, HTML Templates, and Tech Tutorials.',
    primaryColor: '#ffffff',
    hero: {
      ...MOCK_HERO,
      imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80',
      videoUrl: '',
      headline: 'The Ultimate Tech Repository',
      description: 'Acquire production-ready scripts, specialized software, and master-level tutorials for your digital infrastructure.'
    },
    payment: MOCK_PAYMENT,
    gateways: [MOCK_PAYMENT],
    telegram: {
      botToken: '',
      chatId: ''
    }
  });

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Cart hydration failed");
      }
    }
    
    const loadTimeout = setTimeout(() => {
      if (isInitialLoading) setIsInitialLoading(false);
    }, 6000);

    const unsubAuth = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            setUser(data);
          } else {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'User',
              isAdmin: false,
              isSuspended: false
            });
          }
        });
      } else {
        setUser(null);
      }
    });

    const settingsRef = doc(db, 'settings', 'global');
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AppSettings;
        if (!data.gateways) data.gateways = [data.payment || MOCK_PAYMENT];
        setSettings(data);
      }
      setIsInitialLoading(false);
      clearTimeout(loadTimeout);
    }, () => {
      setIsInitialLoading(false);
      clearTimeout(loadTimeout);
    });

    return () => {
      unsubAuth();
      unsubSettings();
      clearTimeout(loadTimeout);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const updateSettings = (newSettings: AppSettings) => setSettings(newSettings);

  const addToCart = (product: Product, options?: { hosting?: boolean; domain?: boolean; inbox?: boolean }) => {
    if (user?.isSuspended) { 
      alert("Unauthorized Access: Your account is restricted."); 
      return; 
    }
    
    const hostingSelected = options?.hosting || false;
    const domainSelected = options?.domain || false;
    const inboxSelected = options?.inbox || false;
    
    let effectivePrice = product.price;
    if (hostingSelected && product.hosting?.enabled) effectivePrice += product.hosting.price;
    if (domainSelected && product.customDomain?.enabled) effectivePrice += product.customDomain.price;
    if (inboxSelected && product.inboxAddon?.enabled) effectivePrice += product.inboxAddon.price;

    const configId = `${product.id}-${hostingSelected}-${domainSelected}-${inboxSelected}`;

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.configId === configId);
      if (existingIndex > -1) {
        return prev.map((item, idx) => idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { 
        ...product, 
        quantity: 1, 
        price: effectivePrice, 
        basePrice: product.price,
        selectedHosting: hostingSelected, 
        selectedDomain: domainSelected,
        selectedInbox: inboxSelected,
        configId
      }];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.configId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity < 1) return removeFromCart(cartItemId);
    setCart(prev => prev.map(item => item.configId === cartItemId ? { ...item, quantity } : item));
  };

  const clearCart = () => setCart([]);
  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <AppContext.Provider value={{ 
      user, setUser, cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, settings, updateSettings, 
      isInitialLoading, isMediaReady, setMediaReady: setIsMediaReady 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
