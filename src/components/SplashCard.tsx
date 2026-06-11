'use client';

import Link from 'next/link';

interface SplashCardProps {
  icon: string;
  title: string;
  description: string;
  buttonText: string;
  href: string;
  id?: string;
}

export default function SplashCard({
  icon,
  title,
  description,
  buttonText,
  href,
  id,
}: SplashCardProps) {
  return (
    <div
      id={id}
      className="flex-1 bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer group"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-serif mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <Link
        href={href}
        className="inline-block border border-[#2c2c2c] px-4 py-2 text-sm transition-colors duration-300 hover:bg-[#2c2c2c] hover:text-white"
      >
        {buttonText}
      </Link>
    </div>
  );
}
