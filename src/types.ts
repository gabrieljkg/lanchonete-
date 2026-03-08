export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: string;
}

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: number;
  total: number;
  created_at: string;
  payment_method: string;
}

export interface SalesReport {
  date: string;
  total: number;
}
