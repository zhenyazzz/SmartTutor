import { pool } from '../config/database.js';

export class ReviewService {
  async getReviewsByTutorId(tutorId) {
    const result = await pool.query(
      `SELECT 
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        u.full_name as author,
        u.email as author_email,
        u.id as student_id
      FROM reviews r
      INNER JOIN users u ON r.student_id = u.id
      WHERE r.tutor_id = $1 AND (r.status = 'APPROVED' OR r.status IS NULL)
      ORDER BY r.created_at DESC`,
      [tutorId]
    );

    return result.rows.map(row => ({
      id: row.id.toString(),
      author: row.author,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(row.author)}&background=random`,
      rating: row.rating,
      date: new Date(row.created_at).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      comment: row.comment,
      studentId: row.student_id.toString()
    }));
  }

  async getRatingDistribution(tutorId) {
    const result = await pool.query(
      `SELECT 
        rating,
        COUNT(*) as count
      FROM reviews
      WHERE tutor_id = $1 AND (status = 'APPROVED' OR status IS NULL)
      GROUP BY rating
      ORDER BY rating DESC`,
      [tutorId]
    );

    const total = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    
    const distribution = {};
    for (let i = 5; i >= 1; i--) {
      const row = result.rows.find(r => r.rating === i);
      const count = row ? parseInt(row.count) : 0;
      distribution[i] = {
        stars: i,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      };
    }

    return Object.values(distribution);
  }

  // Получить все отзывы для модерации
  async getAllReviewsForModeration(status = null) {
    let query = `
      SELECT 
        r.id,
        r.rating,
        r.comment,
        r.status,
        r.created_at,
        u_student.full_name as author_name,
        u_student.email as author_email,
        u_student.id as student_id,
        u_tutor.full_name as tutor_name,
        u_tutor.id as tutor_user_id,
        t.id as tutor_id
      FROM reviews r
      INNER JOIN users u_student ON r.student_id = u_student.id
      INNER JOIN tutors t ON r.tutor_id = t.id
      INNER JOIN users u_tutor ON t.user_id = u_tutor.id
    `;

    const params = [];
    if (status) {
      query += ` WHERE r.status = $1`;
      params.push(status);
    } else {
      query += ` WHERE r.status IS NULL OR r.status = 'PENDING'`;
    }

    query += ` ORDER BY r.created_at DESC`;

    const result = await pool.query(query, params);

    return result.rows.map(row => ({
      id: row.id.toString(),
      type: 'review',
      status: (row.status || 'PENDING').toLowerCase(),
      author: {
        name: row.author_name,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(row.author_name)}&background=random`
      },
      target: {
        name: row.tutor_name,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(row.tutor_name)}&background=random`
      },
      content: row.comment || '',
      rating: row.rating,
      createdAt: row.created_at.toISOString(),
      priority: row.rating <= 2 ? 'high' : row.rating <= 3 ? 'medium' : 'low'
    }));
  }

  // Одобрить отзыв
  async approveReview(reviewId) {
    const result = await pool.query(
      `UPDATE reviews 
       SET status = 'APPROVED' 
       WHERE id = $1 
       RETURNING id, status`,
      [reviewId]
    );

    if (result.rows.length === 0) {
      throw new Error('Review not found');
    }

    return result.rows[0];
  }

  // Отклонить отзыв
  async rejectReview(reviewId, reason = null) {
    const result = await pool.query(
      `UPDATE reviews 
       SET status = 'REJECTED' 
       WHERE id = $1 
       RETURNING id, status`,
      [reviewId]
    );

    if (result.rows.length === 0) {
      throw new Error('Review not found');
    }

    return result.rows[0];
  }

  // Получить статистику модерации
  async getModerationStats() {
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status IS NULL OR status = 'PENDING') as pending,
        COUNT(*) FILTER (WHERE status = 'APPROVED') as approved,
        COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected,
        COUNT(*) as total
      FROM reviews
    `);

    return result.rows[0];
  }
}

