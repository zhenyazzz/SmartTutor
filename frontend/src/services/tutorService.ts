import api from './api';
import { Tutor } from '../components/student/StudentHomePage';

export interface TutorFilters {
  subject?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}

export const tutorService = {
  // Получить всех репетиторов с фильтрами
  getAllTutors: async (filters?: TutorFilters): Promise<Tutor[]> => {
    const params = new URLSearchParams();
    
    if (filters?.subject) {
      params.append('subject', filters.subject);
    }
    if (filters?.minPrice !== undefined) {
      params.append('minPrice', filters.minPrice.toString());
    }
    if (filters?.maxPrice !== undefined) {
      params.append('maxPrice', filters.maxPrice.toString());
    }
    if (filters?.minRating !== undefined) {
      params.append('minRating', filters.minRating.toString());
    }

    const queryString = params.toString();
    const url = `/tutors${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get<Tutor[]>(url);
    return response.data;
  },

  // Получить репетитора по ID
  getTutorById: async (id: string): Promise<Tutor> => {
    const response = await api.get<Tutor>(`/tutors/${id}`);
    return response.data;
  },

  // Получить репетитора по user_id
  getTutorByUserId: async (userId: string | number): Promise<Tutor> => {
    const response = await api.get<Tutor>(`/tutors/user/${userId}`);
    return response.data;
  },

  // Получить студентов репетитора
  getStudentsByTutor: async (tutorId: string): Promise<Student[]> => {
    const response = await api.get<Student[]>(`/tutors/${tutorId}/students`);
    return response.data;
  },

  // Получить статистику репетитора
  getTutorStats: async (tutorId: string, period: string = 'year'): Promise<TutorStats> => {
    const response = await api.get<TutorStats>(`/tutors/${tutorId}/stats?period=${period}`);
    return response.data;
  },

  // Обновить профиль репетитора
  updateTutorProfile: async (tutorId: string, profileData: {
    name?: string;
    email?: string;
    phone?: string;
    avatar?: string;
    subjects?: string[];
    experience?: number;
    hourlyRate?: number;
    location?: string;
    description?: string;
    education?: string;
    onlineFormat?: boolean;
    offlineFormat?: boolean;
  }): Promise<Tutor> => {
    // Формируем формат занятий на основе флагов
    const format: string[] = [];
    if (profileData.onlineFormat) format.push('online');
    if (profileData.offlineFormat) format.push('offline');

    const response = await api.put<Tutor>(`/tutors/${tutorId}`, {
      name: profileData.name,
      email: profileData.email,
      phone: profileData.phone,
      avatar: profileData.avatar,
      subjects: profileData.subjects,
      experience: profileData.experience,
      hourlyRate: profileData.hourlyRate,
      location: profileData.location,
      description: profileData.description,
      education: profileData.education
    });
    return response.data;
  }
};

export interface TutorStats {
  totalStudents: number;
  lessonsThisMonth: number;
  earningsThisMonth: number;
  avgRating: number;
  growth: {
    students: number;
    lessons: number;
    earnings: number;
    rating: number;
  };
  monthlyData: Array<{
    month: string;
    students: number;
    lessons: number;
    earnings: number;
  }>;
  ratingData: Array<{
    month: string;
    rating: number;
  }>;
  subjectDistribution: Array<{
    name: string;
    value: number;
    students: number;
  }>;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  subjects?: string[];
  lessonsCompleted: number;
  lessonsPlanned?: number;
  nextLesson: string;
  status: 'active' | 'paused' | 'completed';
  rating?: number;
  joined: string;
}

