'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [redirect, setRedirect] = useState('/muxintang');
  
  const router = useRouter();
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setRedirect(params.get('redirect') || '/muxintang');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('请填写邮箱和密码');
      return;
    }

    if (!isSupabaseConfigured()) {
      setError('Supabase 未配置，无法登录');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (loginError) {
        if (loginError.message.includes('Email not confirmed')) {
          setError('邮箱尚未验证，请先验证邮箱后再登录');
        } else {
          setError(loginError.message);
        }
      } else if (data.user && data.user.email_confirmed_at) {
        await supabase.auth.getSession();

        try {
          const refCode =
            new URLSearchParams(window.location.search).get('ref') ||
            localStorage.getItem('signup_ref') ||
            '';
          if (refCode) {
            await fetch('/api/user/invite/apply-ref', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ref: refCode }),
            });
            try { localStorage.removeItem('signup_ref'); } catch {}
          }
        } catch { /* 静默 */ }

        await new Promise(resolve => setTimeout(resolve, 500));
        window.location.replace(redirect);
      } else {
        setError('邮箱尚未验证，请先验证邮箱后再登录');
      }
    } catch (err: any) {
      setError(err.message || '登录失败，请稍后再试');
    }

    setLoading(false);
  }

  const handleResendEmail = async () => {
    if (!email) {
      setError('请先输入邮箱地址');
      return;
    }

    if (!isSupabaseConfigured()) {
      setError('Supabase 未配置，无法发送验证邮件');
      return;
    }

    try {
      const { error: resendError } = await supabase.auth.resend({ type: 'signup', email });
      
      if (resendError) {
        setError(resendError.message);
      } else {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || '发送失败，请稍后再试');
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center py-12">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#8B4513] to-[#D4AF37] rounded-full mb-4">
            <span className="text-2xl">🪷</span>
          </div>
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            牧心堂
          </h1>
          <p className="text-[#808080]">心之所向，牧之以道</p>
        </div>

        <div className="bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-xl p-8 shadow-xl">
          {error && (
            <div className="bg-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4 text-center">
              {error}
              {error.includes('邮箱尚未验证') && (
                <button
                  onClick={handleResendEmail}
                  className="block w-full mt-3 py-2 text-sm bg-red-500/30 hover:bg-red-500/40 rounded transition-colors"
                >
                  重新发送验证邮件
                </button>
              )}
            </div>
          )}

          {resendSuccess && (
            <div className="bg-green-500/20 text-green-400 px-4 py-3 rounded-lg mb-4 text-center">
              验证邮件已发送，请检查您的邮箱
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[#C0C0C0] font-medium mb-2">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border border-[#D4AF37]/30 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all"
                placeholder="请输入邮箱"
              />
            </div>

            <div>
              <label className="block text-[#C0C0C0] font-medium mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border border-[#D4AF37]/30 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all"
                placeholder="请输入密码"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#D4AF37] text-black rounded-xl hover:opacity-90 transition-opacity font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <p className="text-center text-[#808080] mt-6">
            还没有账户？{' '}
            <Link
              href="/muxintang/register"
              className="text-[#D4AF37] hover:underline"
            >
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}