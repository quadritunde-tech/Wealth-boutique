export type ProductCategory = 'Clothes' | 'Shoes' | 'Caps';
export type GenderAudience = 'Men' | 'Women' | 'Unisex';
export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered';
export type EnquiryStatus = 'New Enquiry' | 'Replied';
export type PageView = 'home' | 'shop' | 'about' | 'contact' | 'admin';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  gender: GenderAudience;
  price: number;
  image: string;
  options: string[];
  optionLabel: 'Size' | 'Colour';
  description: string;
  isBestSeller?: boolean;
  inStock: boolean;
  createdAt?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  category: ProductCategory;
  price: number;
  image: string;
  selectedOption: string;
  optionLabel: 'Size' | 'Colour';
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  selectedOption: string;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  note?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  source: 'Cart Checkout' | 'Quick Order';
  createdAt: string;
}

export interface Enquiry {
  id: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  selectedOption: string;
  message: string;
  status: EnquiryStatus;
  source: 'Contact Form' | 'Order Now';
  createdAt: string;
}

export interface StylistMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  stylingNote?: string;
  recommendedProducts?: Product[];
  timestamp: string;
}
