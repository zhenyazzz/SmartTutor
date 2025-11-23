import api from './api';

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  comment: string;
  studentId: string;
}

export interface RatingDistribution {
  stars: number;
  count: number;
  percentage: number;
}

export const reviewService = {
  // Получить отзывы репетитора
  getReviewsByTutorId: async (tutorId: string): Promise<Review[]> => {
    const response = await api.get<Review[]>(`/reviews/tutor/${tutorId}`);
    return response.data;
  },

  // Получить распределение рейтингов
  getRatingDistribution: async (tutorId: string): Promise<RatingDistribution[]> => {
    const response = await api.get<RatingDistribution[]>(`/reviews/tutor/${tutorId}/distribution`);
    return response.data;
  }
};

