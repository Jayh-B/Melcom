export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image: string;
  variations?: {
    name: string; // e.g., "Size", "Color"
    options: string[]; // e.g., ["S", "M", "L"]
  }[];
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariations?: Record<string, string>; // e.g., { "Size": "M", "Color": "Black" }
}

export interface TaxBreakdown {
  vat: number;
  nhil: number;
  getFund: number;
  covidLevy: number;
  totalTax: number;
}

export interface Order {
  id: string;
  customerId: string;
  items: CartItem[];
  totalAmount: number;
  taxAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
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
}

export interface AdminStats {
  totalSales: number;
  totalTaxCollected: number;
  orderCount: number;
  customerCount: number;
  lowStockItems: number;
}
