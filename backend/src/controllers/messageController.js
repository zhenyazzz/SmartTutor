import { MessageService } from '../services/messageService.js';

const messageService = new MessageService();

export class MessageController {
  // Получить все беседы пользователя
  async getConversations(req, res) {
    try {
      const userId = req.user.id;
      const conversations = await messageService.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error('Error getting conversations:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  // Получить сообщения беседы
  async getMessages(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      if (!conversationId) {
        return res.status(400).json({ error: 'Conversation ID is required' });
      }

      const messages = await messageService.getMessages(conversationId, userId);
      
      // Отмечаем сообщения как прочитанные
      await messageService.markAsRead(conversationId, userId);

      res.json(messages);
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  // Отправить сообщение
  async sendMessage(req, res) {
    try {
      const { conversationId, text, recipientId } = req.body;
      const senderId = req.user.id;

      if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Message text is required' });
      }

      let finalConversationId = conversationId;

      // Если conversationId не указан, но есть recipientId, создаем или находим беседу
      if (!finalConversationId && recipientId) {
        finalConversationId = await messageService.getOrCreateConversation(senderId, recipientId);
      }

      if (!finalConversationId) {
        return res.status(400).json({ error: 'Conversation ID or recipient ID is required' });
      }

      const message = await messageService.sendMessage(finalConversationId, senderId, text.trim());
      res.status(201).json(message);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  // Отметить сообщения как прочитанные
  async markAsRead(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      if (!conversationId) {
        return res.status(400).json({ error: 'Conversation ID is required' });
      }

      await messageService.markAsRead(conversationId, userId);
      res.json({ message: 'Messages marked as read' });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  // Получить или создать беседу
  async getOrCreateConversation(req, res) {
    try {
      const { userId: otherUserId } = req.params;
      const currentUserId = req.user.id;

      if (!otherUserId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      if (otherUserId === currentUserId.toString()) {
        return res.status(400).json({ error: 'Cannot create conversation with yourself' });
      }

      const conversationId = await messageService.getOrCreateConversation(currentUserId, otherUserId);
      res.json({ conversationId: conversationId.toString() });
    } catch (error) {
      console.error('Error getting or creating conversation:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}

