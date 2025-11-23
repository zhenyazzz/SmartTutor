import { Router } from 'express';
import { ScheduleController } from '../controllers/scheduleController.js';

const router = Router();
const scheduleController = new ScheduleController();

// Получить шаблон расписания (для редактирования репетитором)
router.get('/tutor/:tutorId/template', scheduleController.getScheduleTemplate.bind(scheduleController));

// Получить доступные слоты (для студентов)
router.get('/tutor/:tutorId/available', scheduleController.getAvailableSlots.bind(scheduleController));

// Создать расписание по умолчанию
router.post('/tutor/:tutorId/default', scheduleController.createDefaultSchedule.bind(scheduleController));

// Обновить расписание
router.put('/tutor/:tutorId', scheduleController.updateSchedule.bind(scheduleController));

export default router;

