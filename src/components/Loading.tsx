'use client';

import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  count?: number;
}

export function LoadingSkeleton({
  className = '',
  width = '100%',
  height = '20px',
  count = 1,
}: LoadingSkeletonProps) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          style={{ width, height }}
          className="bg-gray-200 rounded mb-2 last:mb-0"
          animate={{
            background: ['#f3f4f6', '#e5e7eb', '#f3f4f6'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
}

interface PageLoadingProps {
  text?: string;
}

export function PageLoading({ text = '加载中...' }: PageLoadingProps) {
  return (
    <div className="min-h-screen bg-[#f5f0eb] flex items-center justify-center">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-3 border-[#2c2c2c] border-t-transparent rounded-full mx-auto mb-4"
        />
        <p className="text-[#2c2c2c] font-serif">{text}</p>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  retry?: () => void;
}

export function ErrorState({ message = '出错了', retry }: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-[#f5f0eb] flex items-center justify-center">
      <div className="text-center max-w-md p-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-6xl mb-4"
        >
          🙏
        </motion.div>
        <h2 className="text-xl font-serif text-[#2c2c2c] mb-2">抱歉</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        {retry && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={retry}
            className="px-6 py-2 bg-[#2c2c2c] text-white rounded-lg font-serif hover:bg-[#4a4a4a] transition-colors"
          >
            重试
          </motion.button>
        )}
      </div>
    </div>
  );
}

interface ButtonLoadingProps {
  text?: string;
  disabled?: boolean;
}

export function ButtonLoading({ text = '加载中...', disabled = false }: ButtonLoadingProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
      />
      <span>{text}</span>
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  title = '暂无内容',
  description = '这里还没有任何内容',
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-5xl mb-4 text-gray-300"
      >
        {icon || '📭'}
      </motion.div>
      <h3 className="text-lg font-serif text-[#2c2c2c] mb-2">{title}</h3>
      <p className="text-gray-500 text-center max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}
