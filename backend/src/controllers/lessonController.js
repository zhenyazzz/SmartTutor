import { LessonService } from '../services/lessonService.js';
import { MessageService } from '../services/messageService.js';
import { pool } from '../config/database.js';

const lessonService = new LessonService();
const messageService = new MessageService();

export class LessonController {
  async createLesson(req, res) {
    try {
      // Получаем ID текущего пользователя из токена через middleware
      const studentId = req.body.studentId || req.user?.id;
      
      if (!studentId) {
        return res.status(401).json({ error: 'Unauthorized: Student ID is required' });
      }

      // Получаем первый предмет репетитора, если subjectId не указан
      let subjectId = req.body.subjectId;
      if (!subjectId) {
        const subjectResult = await pool.query(
          `SELECT s.id 
           FROM tutor_subjects ts
           INNER JOIN subjects s ON ts.subject_id = s.id
           WHERE ts.tutor_id = $1
           LIMIT 1`,
          [req.body.tutorId]
        );
        
        if (subjectResult.rows.length === 0) {
          return res.status(400).json({ error: 'У репетитора нет предметов' });
        }
        subjectId = subjectResult.rows[0].id;
      }

      const lesson = await lessonService.createLesson({
        tutorId: req.body.tutorId,
        studentId,
        subjectId,
        dateTime: req.body.dateTime,
        duration: req.body.duration || 60,
        price: req.body.price
      });

      // Создаем или получаем беседу между учеником и репетитором
      try {
        // Получаем user_id репетитора из tutor_id
        const tutorResult = await pool.query(
          `SELECT user_id FROM tutors WHERE id = $1`,
          [req.body.tutorId]
        );

        if (tutorResult.rows.length > 0) {
          const tutorUserId = tutorResult.rows[0].user_id;
          // Преобразуем ID в числа для сравнения
          const studentUserId = typeof studentId === 'string' ? parseInt(studentId, 10) : studentId;
          const tutorUser = typeof tutorUserId === 'string' ? parseInt(tutorUserId, 10) : tutorUserId;
          
          // Создаем или получаем беседу
          await messageService.getOrCreateConversation(studentUserId, tutorUser);
          console.log(`[LessonController] Conversation created/found for student ${studentUserId} and tutor ${tutorUser}`);
        } else {
          console.warn(`[LessonController] Tutor not found with id: ${req.body.tutorId}`);
        }
      } catch (conversationError) {
        // Не прерываем создание урока, если не удалось создать беседу
        console.error('[LessonController] Error creating conversation:', conversationError);
      }

      res.status(201).json(lesson);
    } catch (error) {
      console.error('Error creating lesson:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getLessonsByStudent(req, res) {
    try {
      const studentId = req.params.studentId || req.user?.id;
      if (!studentId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const lessons = await lessonService.getLessonsByStudent(studentId);
      res.json(lessons);
    } catch (error) {
      console.error('Error getting lessons:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getLessonsByTutor(req, res) {
    try {
      const lessons = await lessonService.getLessonsByTutor(req.params.tutorId);
      res.json(lessons);
    } catch (error) {
      console.error('Error getting lessons:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async cancelLesson(req, res) {
    try {
      const lessonId = req.params.lessonId;
      
      if (!lessonId) {
        return res.status(400).json({ error: 'ID урока не указан' });
      }

      const lesson = await lessonService.cancelLesson(lessonId);
      res.json(lesson);
    } catch (error) {
      console.error('Error cancelling lesson:', error);
      
      if (error.message === 'Урок не найден') {
        return res.status(404).json({ error: error.message });
      }
      
      if (error.message === 'Урок уже отменен') {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async approveLesson(req, res) {
    try {
      const lessonId = req.params.lessonId;
      
      if (!lessonId) {
        return res.status(400).json({ error: 'ID урока не указан' });
      }

      if (!req.user || req.user.role !== 'TUTOR') {
        return res.status(403).json({ error: 'Доступ разрешен только репетиторам' });
      }

      // Получаем tutor_id из user_id
      const tutorResult = await pool.query(
        `SELECT id FROM tutors WHERE user_id = $1`,
        [req.user.id]
      );

      if (tutorResult.rows.length === 0) {
        return res.status(404).json({ error: 'Репетитор не найден' });
      }

      const tutorId = tutorResult.rows[0].id;
      const lesson = await lessonService.approveLesson(lessonId, tutorId);
      res.json({ message: 'Урок одобрен', lesson });
    } catch (error) {
      console.error('Error approving lesson:', error);
      
      if (error.message === 'Урок не найден') {
        return res.status(404).json({ error: error.message });
      }
      
      if (error.message.includes('не принадлежит') || error.message.includes('уже обработан')) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async rejectLesson(req, res) {
    try {
      const lessonId = req.params.lessonId;
      
      if (!lessonId) {
        return res.status(400).json({ error: 'ID урока не указан' });
      }

      if (!req.user || req.user.role !== 'TUTOR') {
        return res.status(403).json({ error: 'Доступ разрешен только репетиторам' });
      }

      // Получаем tutor_id из user_id
      const tutorResult = await pool.query(
        `SELECT id FROM tutors WHERE user_id = $1`,
        [req.user.id]
      );

      if (tutorResult.rows.length === 0) {
        return res.status(404).json({ error: 'Репетитор не найден' });
      }

      const tutorId = tutorResult.rows[0].id;
      const lesson = await lessonService.rejectLesson(lessonId, tutorId);
      res.json({ message: 'Урок отклонен', lesson });
    } catch (error) {
      console.error('Error rejecting lesson:', error);
      
      if (error.message === 'Урок не найден') {
        return res.status(404).json({ error: error.message });
      }
      
      if (error.message.includes('не принадлежит') || error.message.includes('уже обработан')) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}

