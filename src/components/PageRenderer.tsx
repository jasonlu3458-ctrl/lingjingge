'use client';

import { pageConfigs } from '@/config/pageConfigs';
import ChatUI from '@/components/ChatUI';
import type { UserRole } from '@/lib/auth';

interface PageRendererProps {
  configKey: keyof typeof pageConfigs;
  userRole?: UserRole;
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