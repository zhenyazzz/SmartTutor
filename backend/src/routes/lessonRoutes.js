import { Router } from 'express';
import { LessonController } from '../controllers/lessonController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();
const lessonController = new LessonController();

// Все роуты требуют аутентификации
router.use(authenticateToken);

router.post('/', lessonController.createLesson.bind(lessonController));
// Роут для получения уроков конкретного студента (с параметром должен быть первым)
router.get('/student/:studentId', lessonController.getLessonsByStudent.bind(lessonController));
// Роут для получения уроков текущего пользователя (без параметра)
router.get('/student', lessonController.getLessonsByStudent.bind(lessonController));
router.get('/tutor/:tutorId', lessonController.getLessonsByTutor.bind(lessonController));
router.delete('/:lessonId', lessonController.cancelLesson.bind(lessonController));

export default router;

