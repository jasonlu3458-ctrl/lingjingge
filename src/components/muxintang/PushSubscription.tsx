'use client';

import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function PushSubscription() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => {
          navigator.serviceWorker.ready.then(async (registration) => {
            const subscription = await registration.pushManager.getSubscription();
            if (!subscription) {
              const hasPrompted = localStorage.getItem('pushPrompted');
              if (!hasPrompted) {
                setShowPrompt(true);
              }
            } else {
              setSubscribed(true);
            }
          });
        })
        .catch(console.error);
    }
  }, [userId]);

  const handleSubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        setShowPrompt(false);
        localStorage.setItem('pushPrompted', 'true');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
      });

      if (userId) {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            tenantId: 'muxintang',
            subscription,
          }),
        });
      }

      setSubscribed(true);
      setShowPrompt(false);
      localStorage.setItem('pushPrompted', 'true');
    } catch (error) {
      console.error('[push] subscribe error:', error);
      setShowPrompt(false);
      localStorage.setItem('pushPrompted', 'true');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pushPrompted', 'true');
  };

  if (subscribed) {
    return null;
  }

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-[#1a1a1a] border border-[#D4AF37] rounded-xl px-6 py-4 shadow-2xl max-w-sm">
        <div className="flex items-start gap-4">
          <div className="text-2xl">🌅</div>
          <div className="flex-1">
            <h3 className="text-white font-medium mb-2">订阅阿阇梨晨音</h3>
            <p className="text-sm text-[#808080] mb-4">
              每日清晨，阿阇梨将为您送上心灵开示，愿您平安喜乐。
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSubscribe}
                className="bg-[#8B4513] text-[#D4AF37] px-4 py-2 rounded-lg hover:bg-[#A0522D] transition-colors text-sm"
              >
                订阅
              </button>
              <button
                onClick={handleDismiss}
                className="text-[#808080] px-4 py-2 rounded-lg hover:bg-[#333333] transition-colors text-sm"
              >
                暂不
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
