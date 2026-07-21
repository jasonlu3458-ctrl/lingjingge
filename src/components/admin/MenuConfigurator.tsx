'use client';

import { useState, useEffect } from 'react';
import type { NavItem } from '@/lib/tenant-config';
import { DEFAULT_ENABLED_FEATURES } from '@/lib/tenant-config';

export default function MenuConfigurator() {
  const [menuItems, setMenuItems] = useState<NavItem[]>(DEFAULT_ENABLED_FEATURES);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<Partial<NavItem>>({ label: '', href: '', icon: '' });

  useEffect(() => {
    fetch('/api/admin/tenant-config').then(res => res.json()).then(data => {
      if (data.enabled_features) {
        setMenuItems(data.enabled_features);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaved(false);
    const res = await fetch('/api/admin/update-tenant', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled_features: menuItems }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newItems = [...menuItems];
      [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
      setMenuItems(newItems);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < menuItems.length - 1) {
      const newItems = [...menuItems];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      setMenuItems(newItems);
    }
  };

  const handleDelete = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    if (newItem.label && newItem.href) {
      setMenuItems([...menuItems, {
        label: newItem.label,
        href: newItem.href,
        icon: newItem.icon || undefined,
      }]);
      setNewItem({ label: '', href: '', icon: '' });
      setShowAddForm(false);
    }
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333333]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#D4AF37]" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
          📋 功能菜单配置
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-sm text-[#D4AF37] hover:text-[#F0D77E] flex items-center gap-1"
        >
          + 添加菜单项
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-[#808080]">加载中...</div>
      ) : (
        <>
          {showAddForm && (
            <div className="bg-[#242424] rounded-lg p-4 mb-6">
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  value={newItem.label || ''}
                  onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                  placeholder="菜单名称"
                  className="bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
                />
                <input
                  type="text"
                  value={newItem.href || ''}
                  onChange={(e) => setNewItem({ ...newItem, href: e.target.value })}
                  placeholder="链接路径"
                  className="bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
                />
                <input
                  type="text"
                  value={newItem.icon || ''}
                  onChange={(e) => setNewItem({ ...newItem, icon: e.target.value })}
                  placeholder="图标（可选）"
                  className="bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleAdd}
                  className="muxintang-btn px-4 py-2 text-sm"
                >
                  添加
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewItem({ label: '', href: '', icon: '' });
                  }}
                  className="px-4 py-2 text-sm text-[#808080] hover:text-[#C0C0C0] border border-[#333333] rounded-lg"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2 mb-6">
            {menuItems.map((item, index) => (
              <div
                key={`${item.href}-${index}`}
                className="bg-[#242424] rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="text-[#808080] w-6">{index + 1}</span>
                  <span className="text-xl">{item.icon || '📄'}</span>
                  <div>
                    <p className="text-[#C0C0C0] font-medium">{item.label}</p>
                    <p className="text-xs text-[#808080]">{item.href}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-2 rounded hover:bg-[#333333] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="text-[#C0C0C0]">↑</span>
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === menuItems.length - 1}
                    className="p-2 rounded hover:bg-[#333333] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <span className="text-[#C0C0C0]">↓</span>
                  </button>
                  <button
                    onClick={() => handleDelete(index)}
                    className="p-2 rounded hover:bg-red-900/30"
                  >
                    <span className="text-red-400">🗑️</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            className="muxintang-btn px-8 py-3"
          >
            {saved ? '✓ 已保存' : '保存配置'}
          </button>
        </>
      )}
    </div>
  );
}