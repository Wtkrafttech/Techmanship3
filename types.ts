
export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  imageUrls: string[];
  imageHints?: string[];
  category: string;
  isCustom: boolean;
  modelUrl: string;
  previewUrl?: string;
  hidden?: boolean;
  hosting?: {
    enabled: boolean;
    price: number;
    billingCycle: 'monthly' | 'yearly';
  };
  customDomain?: {
    enabled: boolean;
    price: number;
    billingCycle: 'monthly' | 'yearly';
  };
  inboxAddon?: {
    enabled: boolean;
    price: number;
    billingCycle: 'monthly' | 'yearly';
  };
}

export interface Category {
  id: string;
  name: string;
  imageUrl: string;
  hidden: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  isSuspended?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalPrice: number;
  createdAt: any;
  status: OrderStatus;
}

export interface HeroSettings {
  headline: string;
  description: string;
  buttonText: string;
  backgroundUrl: string;
  backgroundType: 'image' | 'video';
}

export interface PaymentSettings {
  cryptocurrency: string;
  walletAddress: string;
  qrCodeUrl: string;
}
