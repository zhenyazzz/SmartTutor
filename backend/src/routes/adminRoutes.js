import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';

const router = Router();
const adminController = new AdminController();

router.get('/stats', adminController.getPlatformStats.bind(adminController));
router.get('/growth', adminController.getPlatformGrowth.bind(adminController));
router.get('/revenue', adminController.getRevenueData.bind(adminController));
router.get('/revenue-stats', adminController.getRevenueStats.bind(adminController));
router.get('/subjects', adminController.getSubjectPopularity.bind(adminController));
router.get('/cities', adminController.getCityDistribution.bind(adminController));
router.get('/top-tutors', adminController.getTopTutors.bind(adminController));

export default router;

