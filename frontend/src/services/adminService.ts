import api from './api';

export interface PlatformStats {
  totalTutors: number;
  tutorsGrowth: number;
  totalStudents: number;
  studentsGrowth: number;
  lessonsThisMonth: number;
  lessonsGrowth: number;
  commissionThisMonth: number;
  commissionGrowth: number;
}

export interface PlatformGrowth {
  month: string;
  tutors: number;
  students: number;
  lessons: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  commission: number;
}

export interface RevenueStats {
  totalRevenue: number;
  totalCommission: number;
  avgCheck: number;
  revenueGrowth: number;
  commissionGrowth: number;
}

export interface SubjectPopularity {
  subject: string;
  tutors: number;
  students: number;
  avgRating: number;
}

export interface CityDistribution {
  name: string;
  value: number;
  tutors: number;
}

export interface TopTutor {
  id: string;
  name: string;
  subject: string;
  rating: number;
  students: number;
  lessons: number;
  earnings: number;
}

export const adminService = {
  // Получить общую статистику платформы
  getPlatformStats: async (period: string = 'year'): Promise<PlatformStats> => {
    const response = await api.get<PlatformStats>(`/admin/stats?period=${period}`);
    return response.data;
  },

  // Получить данные роста платформы
  getPlatformGrowth: async (period: string = 'year'): Promise<PlatformGrowth[]> => {
    const response = await api.get<PlatformGrowth[]>(`/admin/growth?period=${period}`);
    return response.data;
  },

  // Получить данные по выручке
  getRevenueData: async (period: string = 'year'): Promise<RevenueData[]> => {
    const response = await api.get<RevenueData[]>(`/admin/revenue?period=${period}`);
    return response.data;
  },

  // Получить статистику по выручке
  getRevenueStats: async (period: string = 'year'): Promise<RevenueStats> => {
    const response = await api.get<RevenueStats>(`/admin/revenue-stats?period=${period}`);
    return response.data;
  },

  // Получить популярность предметов
  getSubjectPopularity: async (): Promise<SubjectPopularity[]> => {
    const response = await api.get<SubjectPopularity[]>(`/admin/subjects`);
    return response.data;
  },

  // Получить распределение по городам
  getCityDistribution: async (): Promise<CityDistribution[]> => {
    const response = await api.get<CityDistribution[]>(`/admin/cities`);
    return response.data;
  },

  // Получить топ репетиторов
  getTopTutors: async (limit: number = 10): Promise<TopTutor[]> => {
    const response = await api.get<TopTutor[]>(`/admin/top-tutors?limit=${limit}`);
    return response.data;
  }
};

