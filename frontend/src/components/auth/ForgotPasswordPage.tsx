import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';

interface ForgotPasswordPageProps {
  onNavigateToLogin: () => void;
}

export function ForgotPasswordPage({ onNavigateToLogin }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="p-8 bg-white shadow-lg text-center">
            <div className="size-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="size-8 text-green-600" />
            </div>
            <h2 className="text-gray-900 mb-2">Письмо отправлено!</h2>
            <p className="text-gray-600 mb-6">
              Мы отправили инструкции по восстановлению пароля на адрес <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Не получили письмо? Проверьте папку "Спам" или попробуйте еще раз через несколько минут.
            </p>
            <Button onClick={onNavigateToLogin} className="w-full">
              Вернуться к входу
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={onNavigateToLogin}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="size-4" />
          Назад к входу
        </Button>

        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-indigo-600 mb-2">TutorHub</h1>
          <p className="text-gray-600">Восстановление пароля</p>
        </div>

        <Card className="p-8 bg-white shadow-lg">
          <div className="mb-6">
            <h2 className="text-gray-900 mb-2">Забыли пароль?</h2>
            <p className="text-gray-600 text-sm">
              Введите email, который вы использовали при регистрации. Мы отправим вам ссылку для сброса пароля.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Отправка...
                </>
              ) : (
                'Отправить ссылку для сброса'
              )}
            </Button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Совет:</strong> Если вы не помните email, свяжитесь с нашей службой поддержки по адресу support@tutorhub.com
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
