import api from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'student' | 'tutor' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  avatar: string;
  joinedDate: string;
  lastActive: string;
  verified: boolean;
  stats?: {
    lessons?: number;
    students?: number;
    earnings?: number;
  };
  bio?: string;
  education?: string;
  location?: string;
  hourlyRate?: number;
  rating?: number;
}

export interface UserUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  password?: string;
}

export interface UserCreateData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'tutor' | 'admin';
}

export const userService = {
  // Получить всех пользователей для админ-панели
  getAllUsersForAdmin: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users/admin/all');
    return response.data;
  },

  // Получить детальную информацию о пользователе
  getUserDetailsForAdmin: async (userId: string): Promise<User> => {
    const response = await api.get<User>(`/users/admin/${userId}`);
    return response.data;
  },

  // Обновить пользователя
  updateUser: async (userId: string, data: UserUpdateData): Promise<User> => {
    const response = await api.put<User>(`/users/${userId}`, {
      fullName: data.name,
      email: data.email,
      role: data.role?.toUpperCase(),
      password: data.password
    });
    return response.data;
  },

  // Блокировать/активировать пользователя
  toggleUserStatus: async (userId: string, isActive: boolean): Promise<User> => {
    const response = await api.put<User>(`/users/${userId}/status`, { isActive });
    return response.data;
  },

  // Удалить пользователя
  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`/users/${userId}`);
  },

  // Создать пользователя
  createUser: async (data: UserCreateData): Promise<User> => {
    const response = await api.post<User>('/users', {
      fullName: data.name,
      email: data.email,
      password: data.password,
      role: data.role.toUpperCase()
    });
    return response.data;
  }
};

