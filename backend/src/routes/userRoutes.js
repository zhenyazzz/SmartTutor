import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { body } from 'express-validator';
import { UserRole } from '../models/userModel.js';

const router = Router();
const userController = new UserController();

router.post(
  '/',
  [
    body('fullName').trim().notEmpty().isLength({ max: 100 }),
    body('email').isEmail().isLength({ max: 100 }),
    body('password').isLength({ min: 6, max: 255 }),
    body('role').isIn(Object.values(UserRole))
  ],
  userController.createUser.bind(userController)
);

router.get('/', userController.getAllUsers.bind(userController));
router.get('/admin/all', userController.getAllUsersForAdmin.bind(userController));
router.get('/admin/:id', userController.getUserDetailsForAdmin.bind(userController));
router.get('/:id', userController.getUserById.bind(userController));
router.put('/:id', userController.updateUser.bind(userController));
router.put('/:id/status', userController.toggleUserStatus.bind(userController));
router.delete('/:id', userController.deleteUser.bind(userController));

export default router;

