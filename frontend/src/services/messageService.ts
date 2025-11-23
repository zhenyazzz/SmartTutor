import api from './api';

export interface ChatUser {
  id: string;
  conversationId: string;
  otherUserId: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  role: 'student' | 'tutor';
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  time: string;
  read: boolean;
  createdAt: string;
}

export const messageService = {
  // Получить все беседы пользователя
  getConversations: async (): Promise<ChatUser[]> => {
    const response = await api.get<ChatUser[]>('/messages/conversations');
    return response.data;
  },

  // Получить сообщения беседы
  getMessages: async (conversationId: string): Promise<Message[]> => {
    const response = await api.get<Message[]>(`/messages/conversations/${conversationId}/messages`);
    return response.data;
  },

  // Отправить сообщение
  sendMessage: async (conversationId: string, text: string, recipientId?: string): Promise<Message> => {
    const response = await api.post<Message>('/messages/messages', {
      conversationId,
      text,
      recipientId
    });
    return response.data;
  },

  // Отметить сообщения как прочитанные
  markAsRead: async (conversationId: string): Promise<void> => {
    await api.put(`/messages/conversations/${conversationId}/read`);
  },

  // Получить или создать беседу с пользователем
  getOrCreateConversation: async (userId: string): Promise<{ conversationId: string }> => {
    const response = await api.get<{ conversationId: string }>(`/messages/conversation/${userId}`);
    return response.data;
  }
};

