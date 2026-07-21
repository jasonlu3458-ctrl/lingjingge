'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

function RegisterForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [redirect, setRedirect] = useState<string>('');
  const [refCode, setRefCode] = useState<string>('');

  useEffect(() => {
    const r = searchParams.get('redirect') || '';
    if (r) {
      setRedirect(r);
      if (typeof window !== 'undefined') {
        localStorage.setItem('signup_redirect', r);
      }
    } else if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('signup_redirect');
      if (saved) setRedirect(saved);
    }

    const ref = searchParams.get('ref') || '';
    if (ref) {
      setRefCode(ref);
      try {
        localStorage.setItem('signup_ref', ref);
      } catch {}
    } else if (typeof window !== 'undefined') {
      try {
        const savedRef = localStorage.getItem('signup_ref');
        if (savedRef) setRefCode(savedRef);
      } catch {}
    }
  }, [searchParams]);

  const loginUrl = redirect
    ? `/muxintang/login?redirect=${encodeURIComponent(redirect)}`
    : '/muxintang/login';

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      setError('请填写所有字段');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (!isSupabaseConfigured()) {
      setError('Supabase 未配置，无法注册');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const emailRedirectTo = redirect
        ? `${window.location.origin}/muxintang/login?redirect=${encodeURIComponent(redirect)}`
        : `${window.location.origin}/muxintang/login`;

      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo },
      });

      if (signupError) {
        if (signupError.message.includes('email rate limit exceeded')) {
          setError('邮件发送过于频繁，请稍后再试');
        } else if (signupError.message.includes('User already registered')) {
          setError('该邮箱已被注册，请直接登录');
        } else if (signupError.message.toLowerCase().includes('failed to fetch')) {
          setError('无法连接 Supabase 服务，请检查网络或稍后再试');
        } else {
          setError(signupError.message);
        }
      } else if (data?.user?.identities?.length === 0) {
        setError('该邮箱已被注册，请直接登录');
      } else {
        if (refCode) {
          try {
            await fetch('/api/user/invite/apply-ref', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ref: refCode }),
            });
            try { localStorage.removeItem('signup_ref'); } catch {}
          } catch {
            /* 静默失败 */
          }
        }
        setSignupSuccess(true);
      }
    } catch (err: any) {
      const msg =
        err?.message ||
        (typeof err === 'string' ? err : '') ||
        (err?.toString && err.toString() !== '[object Object]' ? err.toString() : '') ||
        '注册失败，请稍后再试';
      if (msg.toLowerCase().includes('failed to fetch')) {
        setError('无法连接 Supabase 服务（请检查 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 是否正确）');
      } else {
        setError(msg);
      }
      console.error('Signup error:', err);
    }

    setLoading(false);
  }

  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center py-12">
        <div className="w-full max-w-md px-4">
          <div className="bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-xl p-8 shadow-xl text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
            >
              注册成功
            </h2>
            <p className="text-[#808080] mb-6">
              验证邮件已发送到您的邮箱 {email}，请点击邮件中的链接完成验证。
            </p>
            <p className="text-[#606060] text-sm mb-6">
              如果没有收到邮件，请检查垃圾邮件文件夹，或点击下方按钮重新发送。
            </p>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  const { error: resendError } = await supabase.auth.resend({ type: 'signup', email });
                  if (resendError) {
                    if (resendError.message.includes('email rate limit exceeded')) {
                      alert('邮件发送过于频繁，请稍后再试');
                    } else {
                      alert('发送失败: ' + resendError.message);
                    }
                  } else {
                    alert('验证邮件已重新发送');
                  }
                }}
                className="w-full py-3 bg-[#D4AF37] text-black rounded-xl hover:opacity-90 transition-opacity font-semibold"
              >
                重新发送验证邮件
              </button>
              <Link 
                href="/muxintang/login" 
                className="block w-full py-3 border border-[#D4AF37]/30 text-[#D4AF37] rounded-xl hover:bg-[#D4AF37]/10 transition-colors font-semibold text-center"
              >
                返回登录页面
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
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
          <div className="text-center mb-6">
            <h2 
              className="text-xl font-semibold"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
            >
              注册
            </h2>
            <p className="text-[#808080] text-sm">创建您的牧心堂账户</p>
          </div>

          {error && (
            <div className="bg-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-center">
              {error}
            </div>
          )}

          {refCode && (
            <div className="bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 px-4 py-2 rounded-lg mb-4 text-sm text-center">
              🎁 您由同修邀请而来，注册后双方都将获得奖励
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-6">
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

            <div>
              <label className="block text-[#C0C0C0] font-medium mb-2">确认密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-transparent border border-[#D4AF37]/30 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all"
                placeholder="请再次输入密码"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#D4AF37] text-black rounded-xl hover:opacity-90 transition-opacity font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </form>

          <p className="text-center text-[#808080] mt-6">
            已有账户？{' '}
            <Link href={loginUrl} className="text-[#D4AF37] hover:underline">
              立即登录{redirect ? '（验证后自动回到原页面）' : ''}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#808080]">加载中…</div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}