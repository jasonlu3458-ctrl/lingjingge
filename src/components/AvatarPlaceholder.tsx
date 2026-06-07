'use client';

import { motion } from 'framer-motion';

interface AvatarPlaceholderProps {
  name: string;
  size?: number;
  className?: string;
}

export function AvatarPlaceholder({ name, size = 128, className = '' }: AvatarPlaceholderProps) {
  const colors = [
    'from-amber-200 to-amber-300',
    'from-rose-200 to-rose-300',
    'from-violet-200 to-violet-300',
    'from-emerald-200 to-emerald-300',
    'from-cyan-200 to-cyan-300',
  ];
  
  const colorIndex = name.charCodeAt(0) % colors.length;
  const initial = name.charAt(0);

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`relative rounded-full bg-gradient-to-br ${colors[colorIndex]} border-2 border-gray-200 flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <span 
        className="text-3xl font-serif text-gray-700"
        style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
      >
        {initial}
      </span>
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent)]" />
    </motion.div>
  );
}
