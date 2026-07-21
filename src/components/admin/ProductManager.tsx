'use client';

import { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string | null;
  category: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/products');
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定删除这个商品吗？')) {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
      }
    }
  };

  const handleToggleStatus = async (id: string, status: string) => {
    const newStatus = status === 'active' ? 'inactive' : 'active';
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      fetchProducts();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productData = {
      name: formData.get('name') as string,
      price: Number(formData.get('price')),
      description: formData.get('description') as string,
      image_url: formData.get('image_url') as string || null,
      category: formData.get('category') as string,
      status: (formData.get('status') as string) || 'active',
    };

    if (editing) {
      await fetch(`/api/admin/products/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
    } else {
      await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
    }

    setShowForm(false);
    setEditing(null);
    fetchProducts();
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333333]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#D4AF37]" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
          🛒 商品管理
        </h2>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="muxintang-btn px-4 py-2 text-sm"
        >
          + 新增商品
        </button>
      </div>

      {showForm && (
        <div className="bg-[#242424] rounded-lg p-4 mb-6">
          <h3 className="text-sm text-[#C0C0C0] mb-4">{editing ? '编辑商品' : '新增商品'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                defaultValue={editing?.name}
                placeholder="商品名称"
                className="bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
                required
              />
              <input
                type="number"
                name="price"
                defaultValue={editing?.price}
                placeholder="价格"
                className="bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
                required
              />
            </div>
            <input
              type="text"
              name="category"
              defaultValue={editing?.category}
              placeholder="分类"
              className="bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none w-full"
            />
            <textarea
              name="description"
              defaultValue={editing?.description}
              placeholder="商品描述"
              rows={3}
              className="bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none w-full resize-none"
            />
            <input
              type="text"
              name="image_url"
              defaultValue={editing?.image_url || ''}
              placeholder="图片链接（可选）"
              className="bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none w-full"
            />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  defaultChecked={!editing || editing.status === 'active'}
                  className="text-[#D4AF37]"
                />
                <span className="text-[#C0C0C0]">上架</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  defaultChecked={editing?.status === 'inactive'}
                  className="text-[#D4AF37]"
                />
                <span className="text-[#C0C0C0]">下架</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="muxintang-btn px-4 py-2 text-sm">
                保存
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="px-4 py-2 text-sm text-[#808080] hover:text-[#C0C0C0] border border-[#333333] rounded-lg"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-[#808080]">加载中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-[#242424] rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                {product.image_url && (
                  <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded object-cover" />
                )}
                <span className={`px-2 py-1 rounded text-xs ${
                  product.status === 'active'
                    ? 'bg-green-900/30 text-green-400'
                    : 'bg-gray-900/30 text-gray-400'
                }`}>
                  {product.status === 'active' ? '上架' : '下架'}
                </span>
              </div>
              <h3 className="text-[#C0C0C0] font-medium mb-1">{product.name}</h3>
              <p className="text-[#D4AF37] font-bold mb-2">¥{product.price}</p>
              <p className="text-sm text-[#808080] mb-3 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#808080]">{product.category}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleStatus(product.id, product.status)}
                    className="text-xs text-[#D4AF37] hover:text-[#F0D77E]"
                  >
                    {product.status === 'active' ? '下架' : '上架'}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(product);
                      setShowForm(true);
                    }}
                    className="text-xs text-[#D4AF37] hover:text-[#F0D77E]"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}