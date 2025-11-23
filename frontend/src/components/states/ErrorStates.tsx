import React from 'react';
import { AlertCircle, RefreshCw, Home, WifiOff, ServerCrash, Lock } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface ErrorStateProps {
  type?: 'network' | 'server' | 'forbidden' | 'notfound' | 'general';
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}

export function ErrorState({ 
  type = 'general', 
  title, 
  message, 
  onRetry, 
  onGoHome 
}: ErrorStateProps) {
  const getIcon = () => {
    switch (type) {
      case 'network':
        return <WifiOff className="size-16 text-red-500" />;
      case 'server':
        return <ServerCrash className="size-16 text-red-500" />;
      case 'forbidden':
        return <Lock className="size-16 text-red-500" />;
      case 'notfound':
        return <AlertCircle className="size-16 text-red-500" />;
      default:
        return <AlertCircle className="size-16 text-red-500" />;
    }
  };

  const getDefaultContent = () => {
    switch (type) {
      case 'network':
        return {
          title: 'Ошибка сети',
          message: 'Проверьте подключение к интернету и попробуйте снова'
        };
      case 'server':
        return {
          title: 'Ошибка сервера',
          message: 'Что-то пошло не так на нашей стороне. Мы уже работаем над исправлением.'
        };
      case 'forbidden':
        return {
          title: 'Доступ запрещен',
          message: 'У вас нет прав для просмотра этой страницы'
        };
      case 'notfound':
        return {
          title: 'Страница не найдена',
          message: 'К сожалению, запрашиваемая страница не существует'
        };
      default:
        return {
          title: 'Произошла ошибка',
          message: 'Попробуйте обновить страницу или вернуться позже'
        };
    }
  };

  const content = {
    title: title || getDefaultContent().title,
    message: message || getDefaultContent().message
  };

  return (
    <Card className="p-12 bg-white text-center">
      <div className="max-w-md mx-auto">
        {getIcon()}
        <h3 className="text-gray-900 mt-4 mb-2">{content.title}</h3>
        <p className="text-gray-600 mb-6">{content.message}</p>
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <Button onClick={onRetry} className="gap-2">
              <RefreshCw className="size-4" />
              Попробовать снова
            </Button>
          )}
          {onGoHome && (
            <Button onClick={onGoHome} variant="outline" className="gap-2">
              <Home className="size-4" />
              На главную
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// Inline error alert
export function InlineError({ 
  message, 
  onDismiss 
}: { 
  message: string; 
  onDismiss?: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="size-4" />
      <AlertTitle>Ошибка</AlertTitle>
      <AlertDescription className="flex justify-between items-center">
        <span>{message}</span>
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Закрыть
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Error boundary fallback
export function ErrorBoundaryFallback({ 
  error, 
  resetError 
}: { 
  error: Error; 
  resetError: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8">
        <div className="text-center mb-6">
          <AlertCircle className="size-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-gray-900 mb-2">Что-то пошло не так</h1>
          <p className="text-gray-600">
            Произошла неожиданная ошибка. Мы уже получили уведомление и работаем над исправлением.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 p-4 bg-red-50 rounded-lg">
            <summary className="cursor-pointer text-sm text-red-900 mb-2">
              Детали ошибки (только для разработки)
            </summary>
            <pre className="text-xs text-red-800 overflow-auto">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}

        <div className="flex gap-3">
          <Button onClick={resetError} className="flex-1 gap-2">
            <RefreshCw className="size-4" />
            Попробовать снова
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="flex-1 gap-2"
          >
            <Home className="size-4" />
            На главную
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Network error
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return <ErrorState type="network" onRetry={onRetry} />;
}

// Server error
export function ServerError({ onRetry }: { onRetry?: () => void }) {
  return <ErrorState type="server" onRetry={onRetry} />;
}

// 403 Forbidden
export function ForbiddenError({ onGoHome }: { onGoHome?: () => void }) {
  return <ErrorState type="forbidden" onGoHome={onGoHome} />;
}

// 404 Not Found
export function NotFoundError({ onGoHome }: { onGoHome?: () => void }) {
  return <ErrorState type="notfound" onGoHome={onGoHome} />;
}

