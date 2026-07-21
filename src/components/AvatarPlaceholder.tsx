'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface AvatarPlaceholderProps {
  name: string;
  size?: number;
  className?: string;
  /** 真实图片路径，存在则优先使用 */
  image?: string;
}

/**
 * 黑白水墨风头像
 * - 圆角矩形（不再是圆形）
 * - 极淡的墨色阴影与宣纸毛边感
 * - 不再有彩色背景
 * - 真实图片会做去色处理，与整体水墨风保持一致
 * - 图片加载失败时回退到汉字首字
 */
export function AvatarPlaceholder({
  name,
  size = 128,
  className = '',
  image,
}: AvatarPlaceholderProps) {
  const initial = name.charAt(0);
  const [imgError, setImgError] = useState(false);
  // 显式在 dev 模式下 unoptimized，避免 Next.js 对大图（4-5MB）的优化卡住
  const showImage = !!image && !imgError;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`relative overflow-hidden flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        background: '#fbf8f3',
        boxShadow:
          '0 1px 2px rgba(40, 30, 20, 0.06), 0 2px 8px rgba(40, 30, 20, 0.04)',
        border: '1px solid rgba(40, 30, 20, 0.08)',
      }}
    >
      {/* 宣纸纤维纹理 */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            'repeating-linear-gradient(90deg, rgba(40,30,20,0.02) 0 1px, transparent 1px 7px), repeating-linear-gradient(0deg, rgba(40,30,20,0.015) 0 1px, transparent 1px 11px)',
        }}
      />
      {/* 右下角一抹淡墨迹（笔锋感） */}
      <div
        className="absolute pointer-events-none z-10"
        style={{
          right: -size * 0.15,
          bottom: -size * 0.15,
          width: size * 0.7,
          height: size * 0.7,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(40,30,20,0.06) 0%, rgba(40,30,20,0) 70%)',
        }}
      />

      {showImage ? (
        <Image
          src={image!}
          alt={name}
          width={size}
          height={size}
          unoptimized
          className="object-cover"
          style={{
            filter: 'grayscale(1) contrast(1.05) brightness(0.98)',
            width: '100%',
            height: '100%',
          }}
          onError={() => {
            console.warn(`[AvatarPlaceholder] 图片加载失败: ${image} (${name})`);
            setImgError(true);
          }}
        />
      ) : (
        <span
          className="relative z-10 font-serif"
          style={{
            fontFamily: "'Ma Shan Zheng', cursive, serif",
            fontSize: size * 0.45,
            color: '#2c2c2c',
            textShadow: '0 1px 1px rgba(40,30,20,0.08)',
          }}
        >
          {initial}
        </span>
      )}
    </motion.div>
  );
}
