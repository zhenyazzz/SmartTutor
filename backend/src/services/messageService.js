import { pool } from '../config/database.js';

export class MessageService {
  // Получить или создать беседу между двумя пользователями
  async getOrCreateConversation(user1Id, user2Id) {
    // Упорядочиваем ID для уникальности
    const [firstUserId, secondUserId] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

    // Проверяем, существует ли беседа
    let result = await pool.query(
      `SELECT id FROM conversations 
       WHERE user1_id = $1 AND user2_id = $2`,
      [firstUserId, secondUserId]
    );

    if (result.rows.length > 0) {
      return result.rows[0].id;
    }

    // Создаем новую беседу
    result = await pool.query(
      `INSERT INTO conversations (user1_id, user2_id) 
       VALUES ($1, $2) 
       RETURNING id`,
      [firstUserId, secondUserId]
    );

    return result.rows[0].id;
  }

  // Получить все беседы пользователя
  async getConversations(userId) {
    const result = await pool.query(
      `SELECT 
        c.id,
        c.last_message_at,
        CASE 
          WHEN c.user1_id = $1 THEN c.user2_id
          ELSE c.user1_id
        END as other_user_id,
        u.full_name as other_user_name,
        u.role as other_user_role,
        t.avatar_url as other_user_avatar,
        (SELECT text FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_text,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages m 
         WHERE m.conversation_id = c.id 
         AND m.sender_id != $1 
         AND m.read = FALSE) as unread_count
      FROM conversations c
      INNER JOIN users u ON (
        CASE 
          WHEN c.user1_id = $1 THEN u.id = c.user2_id
          ELSE u.id = c.user1_id
        END
      )
      LEFT JOIN tutors t ON t.user_id = u.id
      WHERE c.user1_id = $1 OR c.user2_id = $1
      ORDER BY c.last_message_at DESC NULLS LAST`,
      [userId]
    );

    return result.rows.map(row => ({
      id: row.id.toString(),
      conversationId: row.id.toString(),
      otherUserId: row.other_user_id.toString(),
      name: row.other_user_name,
      role: row.other_user_role.toLowerCase(),
      avatar: row.other_user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.other_user_name)}&background=random`,
      lastMessage: row.last_message_text || '',
      time: this.formatTime(row.last_message_time),
      unread: parseInt(row.unread_count) || 0,
      online: false // Можно добавить позже через WebSocket
    }));
  }

  // Получить сообщения беседы
  async getMessages(conversationId, userId) {
    const result = await pool.query(
      `SELECT 
        m.id,
        m.sender_id,
        m.text,
        m.read,
        m.created_at,
        u.full_name as sender_name
      FROM messages m
      INNER JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC`,
      [conversationId]
    );

    return result.rows.map(row => ({
      id: row.id.toString(),
      senderId: row.sender_id.toString() === userId.toString() ? 'me' : row.sender_id.toString(),
      text: row.text,
      time: new Date(row.created_at).toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      read: row.read,
      createdAt: row.created_at.toISOString()
    }));
  }

  // Отправить сообщение
  async sendMessage(conversationId, senderId, text) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Вставляем сообщение
      const messageResult = await client.query(
        `INSERT INTO messages (conversation_id, sender_id, text) 
         VALUES ($1, $2, $3) 
         RETURNING id, created_at`,
        [conversationId, senderId, text]
      );

      // Обновляем время последнего сообщения в беседе
      await client.query(
        `UPDATE conversations 
         SET last_message_at = $1 
         WHERE id = $2`,
        [messageResult.rows[0].created_at, conversationId]
      );

      await client.query('COMMIT');

      return {
        id: messageResult.rows[0].id.toString(),
        senderId: senderId.toString(),
        text,
        time: new Date(messageResult.rows[0].created_at).toLocaleTimeString('ru-RU', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        read: false,
        createdAt: messageResult.rows[0].created_at.toISOString()
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Отметить сообщения как прочитанные
  async markAsRead(conversationId, userId) {
    await pool.query(
      `UPDATE messages 
       SET read = TRUE 
       WHERE conversation_id = $1 
       AND sender_id != $2 
       AND read = FALSE`,
      [conversationId, userId]
    );
  }

  // Получить беседу по ID пользователей
  async getConversationByUsers(user1Id, user2Id) {
    const [firstUserId, secondUserId] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];
    
    const result = await pool.query(
      `SELECT id FROM conversations 
       WHERE user1_id = $1 AND user2_id = $2`,
      [firstUserId, secondUserId]
    );

    return result.rows.length > 0 ? result.rows[0].id : null;
  }

  // Форматирование времени для отображения
  formatTime(timestamp) {
    if (!timestamp) return '';
    
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffMs = now - messageTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин`;
    if (diffHours < 24) return `${diffHours} ч`;
    if (diffDays < 7) return `${diffDays} д`;
    
    return messageTime.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short' 
    });
  }
}

