'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

function SignupForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [redirect, setRedirect] = useState<string>('');

  useEffect(() => {
    // 从 URL 读 redirect 参数（未注册时存一份，验证/登录时用）
    const r = searchParams.get('redirect') || '';
    if (r) {
      setRedirect(r);
      if (typeof window !== 'undefined') {
        localStorage.setItem('signup_redirect', r);
      }
    } else if (typeof window !== 'undefined') {
      // 兜底：读 localStorage（页面刷新后 searchParams 可能丢失）
      const saved = localStorage.getItem('signup_redirect');
      if (saved) setRedirect(saved);
    }
  }, [searchParams]);

  const loginUrl = redirect
    ? `/tong/login?redirect=${encodeURIComponent(redirect)}`
    : '/tong/login';

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
      // 邮件验证链接带 redirect，验证后到 /tong/login 时回跳
      const emailRedirectTo = redirect
        ? `${window.location.origin}/tong/login?redirect=${encodeURIComponent(redirect)}`
        : `${window.location.origin}/tong/login`;

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
      <div className="min-h-screen bg-zen-beige flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-zen-ink mb-4">注册成功</h2>
          <p className="text-zen-ink/70 mb-6">
            验证邮件已发送到您的邮箱 {email}，请点击邮件中的链接完成验证。
          </p>
          <p className="text-zen-ink/50 text-sm mb-6">
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
              className="w-full py-3 bg-zen-ink text-white rounded-lg hover:bg-zen-ink/80 transition-colors font-semibold"
            >
              重新发送验证邮件
            </button>
            <a 
              href="/tong/login" 
              className="block w-full py-3 border border-zen-gray text-zen-ink rounded-lg hover:bg-zen-beige transition-colors font-semibold"
            >
              返回登录页面
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zen-beige flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zen-ink mb-2">注册</h1>
          <p className="text-zen-ink/60">创建您的灵境阁账户</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-zen-ink font-medium mb-2">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-zen-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-zen-ink/20 bg-zen-beige/50"
              placeholder="请输入邮箱"
            />
          </div>

          <div>
            <label className="block text-zen-ink font-medium mb-2">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-zen-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-zen-ink/20 bg-zen-beige/50"
              placeholder="请输入密码"
            />
          </div>

          <div>
            <label className="block text-zen-ink font-medium mb-2">确认密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-zen-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-zen-ink/20 bg-zen-beige/50"
              placeholder="请再次输入密码"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-zen-ink text-white rounded-lg hover:bg-zen-ink/80 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <p className="text-center text-zen-ink/60 mt-6">
          已有账户？{' '}
          <a href={loginUrl} className="text-zen-ink hover:underline">
            立即登录{redirect ? '（验证后自动回到原页面）' : ''}
          </a>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  // useSearchParams 必须包在 Suspense 里（Next.js 14+ 要求）
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zen-beige flex items-center justify-center">
        <div className="text-zen-ink/60">加载中…</div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
