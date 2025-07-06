'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { register } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  // Password strength calculator
  useEffect(() => {
    const password = formData.password;
    if (!password) {
      setPasswordStrength('weak');
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) setPasswordStrength('weak');
    else if (strength <= 3) setPasswordStrength('medium');
    else setPasswordStrength('strong');
  }, [formData.password]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = '名前を入力してください';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください';
    } else if (
      formData.password.length < 8 || 
      !/[a-z]/.test(formData.password) || 
      !/[A-Z]/.test(formData.password) || 
      !/[0-9]/.test(formData.password)
    ) {
      newErrors.password = 'パスワードは8文字以上で、大文字・小文字・数字を含む必要があります';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワード（確認）を入力してください';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
    }

    // Terms validation
    if (!formData.termsAccepted) {
      newErrors.terms = '利用規約に同意してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'email':
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = '有効なメールアドレスを入力してください';
        } else {
          delete newErrors.email;
        }
        break;
      case 'password':
        if (formData.password && (
          formData.password.length < 8 || 
          !/[a-z]/.test(formData.password) || 
          !/[A-Z]/.test(formData.password) || 
          !/[0-9]/.test(formData.password)
        )) {
          newErrors.password = 'パスワードは8文字以上で、大文字・小文字・数字を含む必要があります';
        } else {
          delete newErrors.password;
        }
        break;
      case 'confirmPassword':
        if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'パスワードが一致しません';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    
    // Force validation of all fields on submit
    const newErrors: Record<string, string> = {};
    
    // Always validate all fields
    if (!formData.name.trim()) {
      newErrors.name = '名前を入力してください';
    }
    if (!formData.email) {
      newErrors.email = 'メールアドレスを入力してください';
    }
    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワード（確認）を入力してください';
    }
    
    setErrors(newErrors);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      if (error?.response?.data?.message?.includes('Email already exists')) {
        setGeneralError('このメールアドレスは既に登録されています');
      } else {
        setGeneralError('登録に失敗しました。もう一度お試しください。');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'strong': return 'text-green-600';
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 'weak': return '弱い';
      case 'medium': return '中';
      case 'strong': return '強い';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            アカウント作成
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
              既にアカウントをお持ちの方
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                名前
              </label>
              <div className="mt-1">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={errors.name}
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
            </div>

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
                  onBlur={() => handleBlur('email')}
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
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onBlur={() => handleBlur('password')}
                  error={errors.password}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
                {formData.password && (
                  <p className={`mt-2 text-sm ${getPasswordStrengthColor()}`}>
                    パスワード強度: {getPasswordStrengthText()}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                パスワード（確認）
              </label>
              <div className="mt-1">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  onBlur={() => handleBlur('confirmPassword')}
                  error={errors.confirmPassword}
                />
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={formData.termsAccepted}
                onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                  利用規約
                </Link>
                に同意します
              </label>
            </div>
            {errors.terms && (
              <p className="text-sm text-red-600">{errors.terms}</p>
            )}

            <div>
              <Button
                type="submit"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                {loading ? '登録中...' : '登録'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}