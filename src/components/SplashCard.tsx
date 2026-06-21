'use client';

import Link from 'next/link';
import ZenAvatar from '@/components/ZenAvatar';

interface SplashCardProps {
  icon?: string; // zenIcon 模式下可不传
  title: string;
  description: string;
  buttonText: string;
  href: string;
  id?: string;
  zenIcon?: boolean; // 是否使用 ZenAvatar 替代 emoji
}

export default function SplashCard({
  icon,
  title,
  description,
  buttonText,
  href,
  id,
  zenIcon = false,
}: SplashCardProps) {
  return (
    <div
      id={id}
      className="flex-1 bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer group flex flex-col"
    >
      <div className="mb-4 flex items-center min-h-[48px]">
        {zenIcon ? (
          <ZenAvatar size={48} opacity={0.25} />
        ) : (
          <span className="text-4xl leading-none">{icon}</span>
        )}
      </div>
      <h3 className="text-xl font-serif mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4 flex-1">{description}</p>
      <Link
        href={href}
        className="w-full sm:w-auto text-center bg-gray-100/80 hover:bg-gray-200/80 text-gray-800 px-6 py-2 rounded-full text-sm inline-flex items-center justify-center gap-1 transition-colors min-h-[44px]"
      >
        {buttonText}
      </Link>
    </div>
  );
}
