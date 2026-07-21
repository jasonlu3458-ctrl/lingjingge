'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);
    setSelectedItems(new Set(cart.map((item: CartItem) => item.id)));
  }, []);

  const updateQuantity = (id: string, delta: number) => {
    const updated = cartItems.map((item) => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const removeItem = (id: string) => {
    const updated = cartItems.filter((item) => item.id !== id);
    setCartItems(updated);
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const toggleSelect = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map(item => item.id)));
    }
  };

  const removeSelected = () => {
    const updated = cartItems.filter(item => !selectedItems.has(item.id));
    setCartItems(updated);
    setSelectedItems(new Set());
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const selectedItemsTotal = cartItems
    .filter(item => selectedItems.has(item.id))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#1a1a1a] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-[#D4AF37] mb-8" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
          🛒 购物车
        </h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-6xl mb-4">🛒</p>
            <p className="text-[#808080] mb-4">购物车是空的</p>
            <Link
              href="/jixiangju"
              className="bg-[#8B4513] text-[#D4AF37] px-6 py-3 rounded-lg hover:bg-[#A0522D] transition-colors"
            >
              去选购
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4 p-4 bg-[#242424] rounded-xl">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-[#C0C0C0] hover:text-[#D4AF37] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedItems.size === cartItems.length}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 text-[#D4AF37]"
                />
                全选
              </button>
              <button
                onClick={removeSelected}
                disabled={selectedItems.size === 0}
                className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                删除选中 ({selectedItems.size})
              </button>
            </div>

            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex gap-4 p-4 bg-[#242424] rounded-xl border transition-all ${
                    selectedItems.has(item.id) ? 'border-[#D4AF37]' : 'border-[#333333]'
                  }`}
                >
                  <button
                    onClick={() => toggleSelect(item.id)}
                    className="flex-shrink-0 mt-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="w-5 h-5 text-[#D4AF37]"
                    />
                  </button>

                  <Link href={`/jixiangju/${item.id}`} className="flex-shrink-0">
                    <div className="w-24 h-24 bg-[#1a1a1a] rounded-lg overflow-hidden">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl opacity-30">📦</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex-1">
                    <h3 className="text-[#C0C0C0] font-medium mb-2 line-clamp-2">
                      {item.name}
                    </h3>
                    <p className="text-xl font-bold text-[#D4AF37] mb-4">
                      ¥{item.price}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 bg-[#1a1a1a] border border-[#333333] rounded text-[#C0C0C0] hover:border-[#D4AF37] transition-colors"
                        >
                          -
                        </button>
                        <span className="text-[#C0C0C0] w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 bg-[#1a1a1a] border border-[#333333] rounded text-[#C0C0C0] hover:border-[#D4AF37] transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        删除
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-[#D4AF37]">
                      ¥{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-[#242424] border-t border-[#333333] p-4">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="text-[#C0C0C0]">
                  共 <span className="text-[#D4AF37] font-bold">{totalItems}</span> 件商品
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[#808080]">合计：</span>
                    <span className="text-2xl font-bold text-[#D4AF37]">¥{totalPrice.toFixed(2)}</span>
                  </div>
                  <Link
                    href="/jixiangju/checkout"
                    className="bg-[#D4AF37] text-[#1a1a1a] px-8 py-3 rounded-lg font-medium hover:bg-[#E5C142] transition-colors"
                  >
                    去结账
                  </Link>
                </div>
              </div>
            </div>

            <div className="h-24" />
          </>
        )}
      </div>
    </div>
  );
}
