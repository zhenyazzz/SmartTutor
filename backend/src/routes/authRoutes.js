import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { body } from 'express-validator';
import { UserRole } from '../models/userModel.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();
const authController = new AuthController();

// Регистрация
router.post(
  '/register',
  [
    body('fullName').trim().notEmpty().isLength({ max: 100 }),
    body('email').isEmail().isLength({ max: 100 }),
    body('password').isLength({ min: 6, max: 255 }),
    body('role').optional().isIn(Object.values(UserRole))
  ],
  authController.register.bind(authController)
);

// Авторизация
router.post(
  '/login',
  [
    body('email').isEmail(),
    body('password').notEmpty()
  ],
  authController.login.bind(authController)
);

// Обновление токенов
router.post('/refresh', authController.refresh.bind(authController));

// Выход
router.post('/logout', authController.logout.bind(authController));

// Выход со всех устройств (требует авторизации)
router.post('/logout-all', authenticateToken, authController.logoutAll.bind(authController));

export default router;

