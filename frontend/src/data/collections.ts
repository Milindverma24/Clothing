import type { Coupon, CollectionItem } from '../types';

export const COUPONS: Coupon[] = [
  {
    code: 'WELCOME10',
    type: 'PERCENTAGE',
    value: 10,
    minimumCartValue: 999,
    maximumDiscount: 1000,
    status: 'ACTIVE',
    description: '10% off on your first order',
  },
  {
    code: 'SAVE500',
    type: 'FIXED_AMOUNT',
    value: 500,
    minimumCartValue: 2499,
    status: 'ACTIVE',
    description: 'Flat ₹500 off on orders above ₹2,499',
  },
  {
    code: 'FREESHIP',
    type: 'FREE_SHIPPING',
    value: 0,
    minimumCartValue: 799,
    status: 'ACTIVE',
    description: 'Free standard delivery across India',
  },
  {
    code: 'MILIND10',
    type: 'FIXED_AMOUNT',
    value: 150,
    minimumCartValue: 1299,
    status: 'ACTIVE',
    description: 'Exclusive ₹150 off',
  },
];

export const COLLECTIONS: CollectionItem[] = [
  {
    id: 'essentials',
    name: 'The Essentials',
    slug: 'essentials',
    tagline: 'Modern wardrobe foundations. Built for movement.',
    description: 'Heavyweight organic fabrics, minimalist cuts, engineered to hold structure through daily wear.',
    image: '/images/collection-essentials.jpg',
    featured: true,
  },
  {
    id: 'new-arrivals',
    name: 'New Season 2026',
    slug: 'new-arrivals',
    tagline: 'Move different. Clean silhouettes.',
    description: 'Contemporary textures, structured drape, and monochrome detailing designed for life on the move.',
    image: '/images/collection-new-arrivals.jpg',
    featured: true,
  },
  {
    id: 'streetwear',
    name: 'Oversized Streetwear',
    slug: 'streetwear',
    tagline: 'Relaxed proportions, raw confidence.',
    description: 'Drop shoulders, boxy drape, heavyweight cotton, and clean minimal trims.',
    image: '/images/collection-streetwear.jpg',
    featured: true,
  },
];
