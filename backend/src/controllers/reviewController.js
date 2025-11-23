import { ReviewService } from '../services/reviewService.js';

const reviewService = new ReviewService();

export class ReviewController {
  async getReviewsByTutorId(req, res) {
    try {
      const reviews = await reviewService.getReviewsByTutorId(req.params.tutorId);
      res.json(reviews);
    } catch (error) {
      console.error('Error getting reviews:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getRatingDistribution(req, res) {
    try {
      const distribution = await reviewService.getRatingDistribution(req.params.tutorId);
      res.json(distribution);
    } catch (error) {
      console.error('Error getting rating distribution:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  // Получить все отзывы для модерации
  async getAllReviewsForModeration(req, res) {
    try {
      const status = req.query.status || null;
      const reviews = await reviewService.getAllReviewsForModeration(status);
      res.json(reviews);
    } catch (error) {
      console.error('Error getting reviews for moderation:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  // Получить статистику модерации
  async getModerationStats(req, res) {
    try {
      const stats = await reviewService.getModerationStats();
      res.json(stats);
    } catch (error) {
      console.error('Error getting moderation stats:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  // Одобрить отзыв
  async approveReview(req, res) {
    try {
      const { reviewId } = req.params;
      if (!reviewId) {
        return res.status(400).json({ error: 'Review ID is required' });
      }
      const review = await reviewService.approveReview(reviewId);
      res.json({ message: 'Review approved successfully', review });
    } catch (error) {
      console.error('Error approving review:', error);
      if (error.message === 'Review not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  // Отклонить отзыв
  async rejectReview(req, res) {
    try {
      const { reviewId } = req.params;
      const { reason } = req.body;
      if (!reviewId) {
        return res.status(400).json({ error: 'Review ID is required' });
      }
      const review = await reviewService.rejectReview(reviewId, reason);
      res.json({ message: 'Review rejected successfully', review });
    } catch (error) {
      console.error('Error rejecting review:', error);
      if (error.message === 'Review not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}

