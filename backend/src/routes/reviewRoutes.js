import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController.js';

const router = Router();
const reviewController = new ReviewController();

router.get('/tutor/:tutorId', reviewController.getReviewsByTutorId.bind(reviewController));
router.get('/tutor/:tutorId/distribution', reviewController.getRatingDistribution.bind(reviewController));

// Роуты для модерации (доступны для админов)
router.get('/moderation', reviewController.getAllReviewsForModeration.bind(reviewController));
router.get('/moderation/stats', reviewController.getModerationStats.bind(reviewController));
router.put('/moderation/:reviewId/approve', reviewController.approveReview.bind(reviewController));
router.put('/moderation/:reviewId/reject', reviewController.rejectReview.bind(reviewController));

export default router;

