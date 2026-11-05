import { BusinessManifest } from '@/platform/config/tenant-contract';

/**
 * Example Template for Future Commercialization / White-Labeling
 * 
 * Shows how easily another business can be configured without touching
 * any underlying platform engine code.
 */
export const exampleWhiteLabelManifest: BusinessManifest = {
  manifestVersion: '1.0.0',
  tenantId: 'example-tech-hub',
  identity: {
    name: 'Himalayan Tech Supplies & Services',
    tagline: 'Enterprise Computing & Power Systems',
    description: 'Specialized hardware distributor and network engineering services.',
    websiteUrl: 'https://exampletech.com.np',
    location: {
      address: 'New Road, Ward 4',
      city: 'Pokhara',
      province: 'Gandaki Province',
      country: 'Nepal',
    },
    contact: {
      phoneDefault: '',
      emailDefault: '',
      whatsappDefault: '',
      hoursDefault: 'Sun - Fri: 9:00 AM - 6:00 PM',
    },
    currency: {
      code: 'NPR',
      symbol: 'रु',
      name: 'Nepalese Rupee',
      formatPattern: 'en-NP',
    },
  },
  branding: {
    primaryColor: '#059669',     // Emerald
    secondaryColor: '#047857',
    accentColor: '#10B981',
    darkSurface: '#064e3b',
    lightSurface: '#F0FDF4',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  deliveryNote: 'Local Pokhara valley courier and nationwide delivery across Nepal.',
  paymentMethodsNote: 'Cash on delivery, Bank transfer, eSewa, Khalti',
  categories: [],
  brands: [],
  services: [],
  products: [],
  banners: [],
  faqs: [],
};
