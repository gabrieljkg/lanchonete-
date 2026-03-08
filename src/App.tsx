/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  History, 
  Package, 
  BarChart3, 
  Plus, 
  Minus, 
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Product, Order, OrderItem, SalesReport } from './types';
import { cn } from './lib/utils';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos' | 'sales' | 'inventory' | 'reports'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reportData, setReportData] = useState<SalesReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, orderRes, reportRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders'),
        fetch('/api/reports/sales-by-day')
      ]);
      setProducts(await prodRes.json());
      setOrders(await orderRes.json());
      setReportData(await reportRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateCartQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const checkout = async (paymentMethod: string) => {
    if (cart.length === 0) return;
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, total, payment_method: paymentMethod })
      });
      if (res.ok) {
        setCart([]);
        fetchData();
        alert("Pedido realizado com sucesso!");
      }
    } catch (error) {
      alert("Erro ao processar pedido");
    }
  };

  const renderDashboard = () => {
    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    const lowStock = products.filter(p => p.stock < 10);
    
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border border-brand-line rounded-none bg-white">
            <p className="col-header">Vendas Totais</p>
            <p className="text-4xl font-mono mt-2">R$ {totalSales.toFixed(2)}</p>
          </div>
          <div className="p-6 border border-brand-line rounded-none bg-white">
            <p className="col-header">Pedidos Hoje</p>
            <p className="text-4xl font-mono mt-2">{orders.length}</p>
          </div>
          <div className="p-6 border border-brand-line rounded-none bg-white">
            <p className="col-header">Produtos Baixo Estoque</p>
            <p className="text-4xl font-mono mt-2 text-red-600">{lowStock.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-6 border border-brand-line bg-white">
            <p className="col-header mb-4">Desempenho de Vendas</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="date" fontSize={10} tickMargin={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="#141414" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="p-6 border border-brand-line bg-white">
            <p className="col-header mb-4">Alertas de Estoque</p>
            <div className="space-y-2">
              {lowStock.length > 0 ? lowStock.map(p => (
                <div key={p.id} className="flex justify-between items-center p-3 border-b border-brand-line/10">
                  <span>{p.name}</span>
                  <span className="font-mono text-red-600">{p.stock} un</span>
                </div>
              )) : (
                <p className="text-sm opacity-50 italic">Nenhum alerta no momento.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPOS = () => {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-160px)]">
        <div className="lg:col-span-2 flex flex-col space-y-4 overflow-hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <input 
              type="text" 
              placeholder="Buscar produtos..." 
              className="w-full pl-10 pr-4 py-3 border border-brand-line bg-white focus:outline-none"
            />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto pr-2">
            {products.map(product => (
              <button 
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className={cn(
                  "p-4 border border-brand-line bg-white text-left transition-all hover:bg-brand-ink hover:text-brand-bg group",
                  product.stock <= 0 && "opacity-50 cursor-not-allowed"
                )}
              >
                <p className="col-header group-hover:text-brand-bg/50">{product.category}</p>
                <p className="font-medium mt-1 truncate">{product.name}</p>
                <div className="flex justify-between items-end mt-4">
                  <p className="font-mono text-lg">R$ {product.price.toFixed(2)}</p>
                  <p className="text-[10px] opacity-50">Estoque: {product.stock}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col border border-brand-line bg-white overflow-hidden">
          <div className="p-4 border-b border-brand-line flex justify-between items-center">
            <p className="col-header">Carrinho</p>
            <button onClick={() => setCart([])} className="text-[10px] uppercase tracking-widest opacity-50 hover:opacity-100">Limpar</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.map(item => (
              <div key={item.id} className="flex flex-col space-y-2 pb-4 border-b border-brand-line/10">
                <div className="flex justify-between">
                  <span className="font-medium">{item.name}</span>
                  <button onClick={() => removeFromCart(item.id)}><Trash2 className="w-4 h-4 opacity-30 hover:opacity-100" /></button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <button onClick={() => updateCartQuantity(item.id, -1)} className="p-1 border border-brand-line hover:bg-brand-ink hover:text-brand-bg"><Minus className="w-3 h-3" /></button>
                    <span className="font-mono w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateCartQuantity(item.id, 1)} className="p-1 border border-brand-line hover:bg-brand-ink hover:text-brand-bg"><Plus className="w-3 h-3" /></button>
                  </div>
                  <span className="font-mono">R$ {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-30 space-y-2">
                <ShoppingCart className="w-8 h-8" />
                <p className="text-sm italic">Carrinho vazio</p>
              </div>
            )}
          </div>

          <div className="p-6 bg-brand-bg border-t border-brand-line space-y-4">
            <div className="flex justify-between items-end">
              <p className="col-header">Total</p>
              <p className="text-3xl font-mono">R$ {total.toFixed(2)}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => checkout('Dinheiro')}
                disabled={cart.length === 0}
                className="py-3 border border-brand-line bg-brand-ink text-brand-bg font-medium hover:bg-opacity-90 disabled:opacity-50"
              >
                Dinheiro
              </button>
              <button 
                onClick={() => checkout('Cartão')}
                disabled={cart.length === 0}
                className="py-3 border border-brand-line bg-white text-brand-ink font-medium hover:bg-brand-ink hover:text-brand-bg disabled:opacity-50"
              >
                Cartão
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInventory = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-serif italic">Estoque de Produtos</h2>
          <button className="flex items-center space-x-2 px-4 py-2 bg-brand-ink text-brand-bg">
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </button>
        </div>

        <div className="border border-brand-line bg-white">
          <div className="grid grid-cols-5 p-4 border-b border-brand-line bg-brand-bg/50">
            <p className="col-header">Nome</p>
            <p className="col-header">Categoria</p>
            <p className="col-header">Preço</p>
            <p className="col-header">Estoque</p>
            <p className="col-header text-right">Ações</p>
          </div>
          <div className="divide-y divide-brand-line/10">
            {products.map(p => (
              <div key={p.id} className="grid grid-cols-5 p-4 items-center hover:bg-brand-bg/30 transition-colors">
                <span className="font-medium">{p.name}</span>
                <span className="text-sm opacity-60">{p.category}</span>
                <span className="font-mono">R$ {p.price.toFixed(2)}</span>
                <span className={cn("font-mono", p.stock < 10 ? "text-red-600 font-bold" : "")}>{p.stock} un</span>
                <div className="flex justify-end space-x-4">
                  <button className="text-xs uppercase tracking-widest opacity-50 hover:opacity-100">Editar</button>
                  <button className="text-xs uppercase tracking-widest text-red-600 opacity-50 hover:opacity-100">Excluir</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSales = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-serif italic">Histórico de Vendas</h2>
        <div className="border border-brand-line bg-white">
          <div className="grid grid-cols-4 p-4 border-b border-brand-line bg-brand-bg/50">
            <p className="col-header">ID</p>
            <p className="col-header">Data/Hora</p>
            <p className="col-header">Pagamento</p>
            <p className="col-header text-right">Total</p>
          </div>
          <div className="divide-y divide-brand-line/10">
            {orders.map(o => (
              <div key={o.id} className="grid grid-cols-4 p-4 items-center hover:bg-brand-bg/30 transition-colors">
                <span className="font-mono text-xs opacity-50">#{o.id.toString().padStart(5, '0')}</span>
                <span className="text-sm">{new Date(o.created_at).toLocaleString()}</span>
                <span className="text-sm">{o.payment_method}</span>
                <span className="font-mono text-right">R$ {o.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderReports = () => {
    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-serif italic">Relatórios Detalhados</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-6 border border-brand-line bg-white">
            <p className="col-header mb-6">Faturamento Diário</p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis dataKey="date" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#141414" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6 border border-brand-line bg-white">
            <p className="col-header mb-6">Resumo de Métricas</p>
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-brand-line pb-2">
                <span className="text-sm opacity-60">Ticket Médio</span>
                <span className="font-mono text-xl">R$ {(orders.reduce((s,o) => s+o.total, 0) / (orders.length || 1)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-end border-b border-brand-line pb-2">
                <span className="text-sm opacity-60">Total de Itens Vendidos</span>
                <span className="font-mono text-xl">142</span>
              </div>
              <div className="flex justify-between items-end border-b border-brand-line pb-2">
                <span className="text-sm opacity-60">Dia de Maior Venda</span>
                <span className="font-mono text-xl">08/03/2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-brand-line bg-white px-8 py-6 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-baseline space-x-2">
          <h1 className="text-3xl font-serif italic font-bold tracking-tighter">Lanchonete Pro</h1>
          <span className="text-[10px] uppercase tracking-widest opacity-30">v1.0.0</span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest opacity-50">Operador</p>
            <p className="font-medium">Gabriel Calid</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-ink flex items-center justify-center text-brand-bg">
            <span className="font-serif italic font-bold">G</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-brand-line bg-white flex flex-col">
          <nav className="flex-1 p-4 space-y-2">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 transition-colors",
                activeTab === 'dashboard' ? "bg-brand-ink text-brand-bg" : "hover:bg-brand-bg"
              )}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>
            <button 
              onClick={() => setActiveTab('pos')}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 transition-colors",
                activeTab === 'pos' ? "bg-brand-ink text-brand-bg" : "hover:bg-brand-bg"
              )}
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="font-medium">Caixa / Pedido</span>
            </button>
            <button 
              onClick={() => setActiveTab('sales')}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 transition-colors",
                activeTab === 'sales' ? "bg-brand-ink text-brand-bg" : "hover:bg-brand-bg"
              )}
            >
              <History className="w-5 h-5" />
              <span className="font-medium">Vendas</span>
            </button>
            <button 
              onClick={() => setActiveTab('inventory')}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 transition-colors",
                activeTab === 'inventory' ? "bg-brand-ink text-brand-bg" : "hover:bg-brand-bg"
              )}
            >
              <Package className="w-5 h-5" />
              <span className="font-medium">Estoque</span>
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 transition-colors",
                activeTab === 'reports' ? "bg-brand-ink text-brand-bg" : "hover:bg-brand-bg"
              )}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Relatórios</span>
            </button>
          </nav>
          
          <div className="p-6 border-t border-brand-line bg-brand-bg/20">
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Sistema Online</span>
            </div>
            <p className="text-[10px] mt-1 opacity-50">Última sincronização: Agora</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-brand-bg/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'pos' && renderPOS()}
              {activeTab === 'sales' && renderSales()}
              {activeTab === 'inventory' && renderInventory()}
              {activeTab === 'reports' && renderReports()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
