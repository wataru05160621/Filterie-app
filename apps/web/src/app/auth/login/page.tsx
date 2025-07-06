'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { login } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください';
    } else if (formData.password.length < 8) {
      newErrors.password = 'パスワードは8文字以上必要です';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    
    if (field === 'email') {
      if (!value) {
        newErrors.email = 'メールアドレスを入力してください';
      } else if (!/\S+@\S+\.\S+/.test(value)) {
        newErrors.email = '有効なメールアドレスを入力してください';
      } else {
        delete newErrors.email;
      }
    }
    
    if (field === 'password') {
      if (!value) {
        newErrors.password = 'パスワードを入力してください';
      } else if (value.length < 8) {
        newErrors.password = 'パスワードは8文字以上必要です';
      } else {
        delete newErrors.password;
      }
    }
    
    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await login({
        email: formData.email,
        password: formData.password,
      });
      
      // Redirect to dashboard or the page they were trying to access
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
    } catch (error) {
      setGeneralError('メールアドレスまたはパスワードが正しくありません');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ログイン
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            アカウントをお持ちでない方は{' '}
            <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
              アカウントを作成
            </Link>
          </p>
        </div>
        
        <Card>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {generalError && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{generalError}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                メールアドレス
              </label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onBlur={(e) => validateField('email', e.target.value)}
                  error={errors.email}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                パスワード
              </label>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onBlur={(e) => validateField('password', e.target.value)}
                  error={errors.password}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Link
                href="/auth/reset-password"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                パスワードを忘れた方
              </Link>
            </div>

            <div>
              <Button
                type="submit"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                {loading ? 'ログイン中...' : 'ログイン'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}