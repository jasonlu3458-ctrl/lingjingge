'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [redirect, setRedirect] = useState('/home');
  
  const router = useRouter();
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setRedirect(params.get('redirect') || '/home');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('请填写邮箱和密码');
      return;
    }

    // 检查 Supabase 是否配置
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
        // 强制刷新会话，确保 cookies 被正确设置
        await supabase.auth.getSession();
        
        // 等待一小段时间确保 cookies 写入完成
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 使用 window.location.replace 确保 cookies 被发送
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
    <div className="min-h-screen bg-zen-beige flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zen-ink mb-2">登录</h1>
          <p className="text-zen-ink/60">欢迎回到灵境阁</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-center">
            {error}
            {error.includes('邮箱尚未验证') && (
              <button
                onClick={handleResendEmail}
                className="block w-full mt-3 py-2 text-sm bg-red-100 hover:bg-red-200 rounded transition-colors"
              >
                重新发送验证邮件
              </button>
            )}
          </div>
        )}

        {resendSuccess && (
          <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-4 text-center">
            验证邮件已发送，请检查您的邮箱
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-zen-ink text-white rounded-lg hover:bg-zen-ink/80 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="text-center text-zen-ink/60 mt-6">
          还没有账户？{' '}
          <a href="/tong/signup" className="text-zen-ink hover:underline">
            立即注册
          </a>
        </p>
      </div>
    </div>
  );
}