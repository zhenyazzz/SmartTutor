import api from './api';

export interface ScheduleSlot {
  id: string;
  slotId: number;
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  dateTime: string;
}

export interface ScheduleTemplate {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export const scheduleService = {
  // Получить шаблон расписания (для репетитора)
  getScheduleTemplate: async (tutorId: string): Promise<ScheduleTemplate[]> => {
    const response = await api.get<ScheduleTemplate[]>(`/schedule/tutor/${tutorId}/template`);
    return response.data;
  },

  // Получить доступные слоты (для студентов)
  getAvailableSlots: async (tutorId: string, daysAhead: number = 14): Promise<ScheduleSlot[]> => {
    const response = await api.get<ScheduleSlot[]>(`/schedule/tutor/${tutorId}/available?daysAhead=${daysAhead}`);
    return response.data;
  },

  // Создать расписание по умолчанию
  createDefaultSchedule: async (tutorId: string): Promise<void> => {
    await api.post(`/schedule/tutor/${tutorId}/default`);
  },

  // Обновить расписание
  updateSchedule: async (tutorId: string, slots: ScheduleTemplate[]): Promise<void> => {
    await api.put(`/schedule/tutor/${tutorId}`, { slots });
  }
};

