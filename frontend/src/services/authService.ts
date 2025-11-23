import api from './api';

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  role?: 'STUDENT' | 'TUTOR' | 'ADMIN';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: number;
    fullName: string;
    email: string;
    role: string;
    createdAt: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  // Регистрация
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    // Сохраняем токены
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    return response.data;
  },

  // Авторизация
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    // Сохраняем токены
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    return response.data;
  },

  // Обновление токенов
  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await api.post<RefreshTokenResponse>('/auth/refresh', { refreshToken });
    // Обновляем токены
    localStorage.setItem('accessToken', response.data.accessToken);
    if (response.data.refreshToken) {
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    return response.data;
  },

  // Выход
  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    // Удаляем токены
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  // Выход со всех устройств
  logoutAll: async (): Promise<void> => {
    try {
      await api.post('/auth/logout-all');
    } catch (error) {
      console.error('Logout all error:', error);
    }
    // Удаляем токены
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  // Проверка авторизации
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('accessToken');
  },

  // Получение текущего пользователя из токена (без валидации на сервере)
  getCurrentUser: () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
      // Простое декодирование без проверки подписи (для UI)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.id,
        email: payload.email,
        role: payload.role
      };
    } catch (error) {
      return null;
    }
  }
};

