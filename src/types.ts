export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image: string;
  images?: string[];
  brand?: string;
  rating?: number;
  reviewCount?: number;
  specifications?: Record<string, string>;
  variations?: { name: string; options: string[] }[];
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariations?: Record<string, string>;
}

export interface TaxBreakdown {
  vat: number;
  nhil: number;
  getFund: number;
  covidLevy: number;
  totalTax: number;
}

export interface ShippingDetails {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  email?: string;
}

export interface Order {
  id: string;
  customerId: string;
  items: CartItem[];
  totalAmount: number;
  taxAmount: number;
  paymentMethod: string;
  paymentReference?: string;
  status: 'Pending' | 'Paid' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdAt: string;
  shippingDetails?: ShippingDetails;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  loyaltyPoints: number;
  lastPurchase?: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  categories?: string[];
  paymentTerms?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  notes?: string;
}

export interface AdminStats {
  totalSales: number;
  totalTaxCollected: number;
  orderCount: number;
  customerCount: number;
  lowStockItems: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface UserRole {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'manager' | 'customer';
  createdAt: string;
  photoURL?: string;
}

export interface CookieConsent {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  timestamp: string;
}
