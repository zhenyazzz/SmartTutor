import { Router } from 'express';
import { MessageController } from '../controllers/messageController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();
const messageController = new MessageController();

// Все роуты требуют аутентификации
router.use(authenticateToken);

// Получить все беседы пользователя
router.get('/conversations', messageController.getConversations.bind(messageController));

// Получить или создать беседу с пользователем
router.get('/conversation/:userId', messageController.getOrCreateConversation.bind(messageController));

// Получить сообщения беседы
router.get('/conversations/:conversationId/messages', messageController.getMessages.bind(messageController));

// Отправить сообщение
router.post('/messages', messageController.sendMessage.bind(messageController));

// Отметить сообщения как прочитанные
router.put('/conversations/:conversationId/read', messageController.markAsRead.bind(messageController));

export default router;

