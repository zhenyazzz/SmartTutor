import api from './api';

export interface Lesson {
  id: string;
  tutorId?: string;
  tutorName?: string;
  studentName?: string;
  subjectName: string;
  dateTime: string;
  duration: number;
  price: number;
  status: 'PLANNED' | 'COMPLETED' | 'CANCELLED';
}

export interface CreateLessonData {
  tutorId: string;
  studentId?: string;
  subjectId?: string;
  dateTime: string;
  duration?: number;
  price: number;
}

export const lessonService = {
  // Создать урок
  createLesson: async (data: CreateLessonData): Promise<Lesson> => {
    const response = await api.post<Lesson>('/lessons', data);
    return response.data;
  },

  // Получить уроки студента
  getLessonsByStudent: async (studentId?: string): Promise<Lesson[]> => {
    const url = studentId ? `/lessons/student/${studentId}` : '/lessons/student';
    const response = await api.get<Lesson[]>(url);
    return response.data;
  },

  // Получить уроки репетитора
  getLessonsByTutor: async (tutorId: string): Promise<Lesson[]> => {
    const response = await api.get<Lesson[]>(`/lessons/tutor/${tutorId}`);
    return response.data;
  }
};

