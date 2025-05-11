const CDN = process.env.NEXT_PUBLIC_SUPABASE_URL + '/storage/v1/object/public/license-templates';

export interface LicenseInfo {
  name: string;
  price: number;
  path: string;
  features: string[];
}

export const licenses: Record<string, LicenseInfo> = {
  'Non-Exclusive': {
    name: 'Non-Exclusive',
    price: 12.99,
    path: 'https://qrmpgkotkbmoddqiorje.supabase.co/storage/v1/object/public/license-templates//NON-EXCLUSIVE%20LICENSE%20AGREEMENT%20TEMPLATE.pdf',
    features: [
      'MP3 File (Tagless)',
      'Up to 100k streams',
      'All platforms',
      '50% royalty split'
    ]
  },
  'Non-Exclusive Plus': {
    name: 'Non-Exclusive Plus',
    price: 24.99,
    path: 'https://qrmpgkotkbmoddqiorje.supabase.co/storage/v1/object/public/license-templates//NON-EXCLUSIVE%20PLUS%20LICENSE%20AGREEMENT%20TEMPLATE.pdf',
    features: [
      'MP3 File (Tagless)',
      'Unlimited streams',
      'All platforms',
      '40% royalty split'
    ]
  },
  'Exclusive': {
    name: 'Exclusive',
    price: 29.99,
    path: 'https://qrmpgkotkbmoddqiorje.supabase.co/storage/v1/object/public/license-templates//EXCLUSIVE%20LICENSE%20AGREEMENT%20TEMPLATE.pdf',
    features: [
      'MP3 File (Tagless)',
      'Up to 100k streams',
      'All platforms',
      '50% royalty split',
      'Producer keeps distribution'
    ]
  },
  'Exclusive Plus': {
    name: 'Exclusive Plus',
    price: 49.99,
    path: 'https://qrmpgkotkbmoddqiorje.supabase.co/storage/v1/object/public/license-templates//EXCLUSIVE%20PLUS%20LICENSE%20AGREEMENT%20TEMPLATE.pdf',
    features: [
      'MP3 File (Tagless)',
      'Unlimited streams',
      'All platforms',
      '30% royalty split',
      'Producer keeps distribution'
    ]
  },
  'Exclusive Pro': {
    name: 'Exclusive Pro',
    price: 79.99,
    path: 'https://qrmpgkotkbmoddqiorje.supabase.co/storage/v1/object/public/license-templates//EXCLUSIVE%20PRO%20LICENSE%20AGREEMENT%20TEMPLATE.pdf',
    features: [
      'MP3 File (Tagless)',
      'Unlimited streams',
      'All platforms',
      '10% royalty split',
      'Producer keeps distribution',
      'Free Non-Exclusive Plus beat'
    ]
  }
}; 