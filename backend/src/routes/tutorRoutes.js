import { Router } from 'express';
import { TutorController } from '../controllers/tutorController.js';

const router = Router();
const tutorController = new TutorController();

router.get('/', tutorController.getAllTutors.bind(tutorController));
router.get('/user/:userId', tutorController.getTutorByUserId.bind(tutorController));
router.get('/:tutorId/students', tutorController.getStudentsByTutor.bind(tutorController));
router.get('/:tutorId/stats', tutorController.getTutorStats.bind(tutorController));
router.get('/:id', tutorController.getTutorById.bind(tutorController));
router.put('/:id', tutorController.updateTutor.bind(tutorController));

export default router;

