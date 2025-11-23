import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor для добавления токена авторизации
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn(`[API Request] No token found for ${config.method?.toUpperCase()} ${config.url}`);
  }
  // Логирование для отладки (только для важных запросов)
  if (config.url?.includes('/messages') || config.url?.includes('/auth')) {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, token ? 'with token' : 'NO TOKEN');
  }
  return config;
});

// Interceptor для обработки ошибок и автоматического обновления токена
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Если токен истек (401) и это не повторный запрос
    // НЕ обновляем токен для запросов на /auth/login и /auth/register
    // И не пытаемся обновить токен, если сам запрос на refresh вернул 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                             originalRequest.url?.includes('/auth/register') ||
                             originalRequest.url?.includes('/auth/refresh');
      
      if (isAuthEndpoint) {
        // Для эндпоинтов авторизации просто возвращаем ошибку
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // Нет refresh токена - возвращаем ошибку БЕЗ очистки токенов
          // Пусть компонент сам решает, что делать
          const authError = new Error('Refresh token not found');
          (authError as any).isAuthError = true;
          (authError as any).status = 401;
          return Promise.reject(authError);
        }

        // Обновляем токен
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        // Повторяем оригинальный запрос с новым токеном
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError: any) {
        // Не удалось обновить токен - НЕ очищаем токены автоматически
        // Пусть пользователь сам решит, что делать
        
        // Создаем более понятную ошибку
        const errorMessage = refreshError.response?.data?.error || 'Сессия истекла. Пожалуйста, войдите заново.';
        const authError = new Error(errorMessage);
        (authError as any).isAuthError = true;
        (authError as any).status = 401;
        (authError as any).shouldClearTokens = true; // Флаг для компонента
        
        return Promise.reject(authError);
      }
    }

    // Логирование ошибок для отладки
    if (error.response) {
      console.error(`[API Error] ${error.response.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error.response.data);
    } else if (error.request) {
      console.error('[API Error] No response received:', error.request);
    } else {
      console.error('[API Error]', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;

