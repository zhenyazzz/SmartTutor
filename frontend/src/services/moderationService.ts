import api from './api';

export interface ModerationItem {
  id: string;
  type: 'review' | 'profile' | 'complaint';
  status: 'pending' | 'approved' | 'rejected';
  author: {
    name: string;
    avatar: string;
  };
  target?: {
    name: string;
    avatar: string;
  };
  content: string;
  reason?: string;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
  rating?: number;
}

export interface ModerationStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export const moderationService = {
  // Получить все элементы для модерации
  getAllItemsForModeration: async (status?: string): Promise<ModerationItem[]> => {
    const params = status ? `?status=${status.toUpperCase()}` : '';
    const response = await api.get<ModerationItem[]>(`/reviews/moderation${params}`);
    return response.data;
  },

  // Получить статистику модерации
  getModerationStats: async (): Promise<ModerationStats> => {
    const response = await api.get<ModerationStats>('/reviews/moderation/stats');
    return response.data;
  },

  // Одобрить отзыв
  approveReview: async (reviewId: string): Promise<void> => {
    await api.put(`/reviews/moderation/${reviewId}/approve`);
  },

  // Отклонить отзыв
  rejectReview: async (reviewId: string, reason?: string): Promise<void> => {
    await api.put(`/reviews/moderation/${reviewId}/reject`, { reason });
  }
};

