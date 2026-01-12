
import { Product, Category, HeroSettings, PaymentSettings } from './types';

export const MOCK_PRODUCTS: Product[] = [];

export const MOCK_CATEGORIES: Category[] = [];

export const MOCK_HERO: HeroSettings = {
  headline: 'Elevate Your Digital Craft',
  description: 'Premium 3D assets, textures, and environments for the modern creator.',
  buttonText: 'Browse Templates',
  backgroundUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80',
  backgroundType: 'image'
};

export const MOCK_PAYMENT: PaymentSettings = {
  cryptocurrency: 'Ethereum (ETH)',
  walletAddress: '0x0000000000000000000000000000000000000000',
  qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0x0000000000000000000000000000000000000000'
};
