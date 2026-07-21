import { headers } from 'next/headers';

const MUXINTANG_PATH = '/muxintang';
const IMMERSIVE_PATHS = ['/wen/chan/ai-zen-master'];

export function shouldRenderNavbar(): { render: boolean; immersive: boolean } {
  const pathname = headers().get('x-pathname') || '';
  
  if (!pathname) {
    return { render: false, immersive: false };
  }
  
  if (pathname === '/') {
    return { render: false, immersive: false };
  }
  
  if (pathname.startsWith(MUXINTANG_PATH)) {
    return { render: false, immersive: false };
  }
  
  const immersive = IMMERSIVE_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  
  return { render: true, immersive };
}
