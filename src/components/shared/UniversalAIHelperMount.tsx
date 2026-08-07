'use client';

import dynamic from 'next/dynamic';
import type { UniversalAIHelperRole } from './UniversalAIHelper';

const UniversalAIHelper = dynamic(
  () => import('./UniversalAIHelper').then((mod) => ({ default: mod.UniversalAIHelper })),
  { ssr: false }
);

/**
 * 客户端壳：把 UniversalAIHelper（next/dynamic ssr:false）暴露给服务端 layout.tsx 使用。
 */
export default function UniversalAIHelperMount({ role }: { role: UniversalAIHelperRole }) {
  return <UniversalAIHelper role={role} />;
}
