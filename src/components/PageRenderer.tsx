'use client';

import { pageConfigs } from '@/config/pageConfigs';
import ChatUI from '@/components/ChatUI';

interface PageRendererProps {
  configKey: keyof typeof pageConfigs;
  userRole?: string;
}

export default function PageRenderer({ configKey, userRole = 'free' }: PageRendererProps) {
  const config = pageConfigs[configKey];
  return (
    <ChatUI
      config={config}
      userRole={userRole}
    />
  );
}