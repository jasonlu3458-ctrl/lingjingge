import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-zen-beige border-b border-zen-gray sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-zen-ink">
              灵境阁
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-zen-ink hover:text-gray-600 transition-colors"
            >
              首页
            </Link>
            <Link 
              href="/ai-zen-master" 
              className="text-zen-ink hover:text-gray-600 transition-colors"
            >
              AI 禅师
            </Link>
            <Link 
              href="/health" 
              className="text-zen-ink hover:text-gray-600 transition-colors"
            >
              体质观察
            </Link>
            <Link 
              href="/name" 
              className="text-zen-ink hover:text-gray-600 transition-colors"
            >
              取名轩
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
