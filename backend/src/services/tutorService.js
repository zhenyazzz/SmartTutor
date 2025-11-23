import { pool } from '../config/database.js';

export class TutorService {
  async getAllTutors(filters = {}) {
    let query = `
      SELECT 
        t.id,
        t.user_id,
        u.full_name as name,
        t.experience_years as experience,
        t.rating,
        t.hourly_rate,
        t.location,
        t.avatar_url,
        t.bio,
        t.education,
        t.phone,
        COALESCE(COUNT(DISTINCT r.id), 0) as reviews_count,
        ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as subjects
      FROM tutors t
      INNER JOIN users u ON t.user_id = u.id
      LEFT JOIN tutor_subjects ts ON t.id = ts.tutor_id
      LEFT JOIN subjects s ON ts.subject_id = s.id
      LEFT JOIN reviews r ON t.id = r.tutor_id
      WHERE u.is_active = true
    `;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (filters.subject) {
      conditions.push(`EXISTS (
        SELECT 1 FROM tutor_subjects ts2
        INNER JOIN subjects s2 ON ts2.subject_id = s2.id
        WHERE ts2.tutor_id = t.id AND s2.name = $${paramCount++}
      )`);
      values.push(filters.subject);
    }

    if (filters.minPrice !== undefined) {
      conditions.push(`t.hourly_rate >= $${paramCount++}`);
      values.push(filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      conditions.push(`t.hourly_rate <= $${paramCount++}`);
      values.push(filters.maxPrice);
    }

    if (filters.minRating !== undefined) {
      conditions.push(`t.rating >= $${paramCount++}`);
      values.push(filters.minRating);
    }

    if (conditions.length > 0) {
      query += ` AND ${conditions.join(' AND ')}`;
    }

    query += `
      GROUP BY t.id, t.user_id, u.full_name, t.experience_years, t.rating, 
               t.hourly_rate, t.location, t.avatar_url, t.bio, t.education, t.phone
      ORDER BY t.rating DESC, t.id
    `;

    const result = await pool.query(query, values);

    return result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name,
      subjects: row.subjects || [],
      rating: parseFloat(row.rating) || 0,
      reviews: parseInt(row.reviews_count) || 0,
      hourlyRate: parseFloat(row.hourly_rate) || 0,
      experience: row.experience || 0,
      avatar: row.avatar_url || '',
      isOnline: true, // Можно добавить логику для определения онлайн статуса
      format: row.location ? ['online', 'offline'] : ['online'],
      location: row.location || undefined,
      availability: [], // Можно добавить логику для получения расписания
      bio: row.bio,
      education: row.education,
      phone: row.phone || undefined
    }));
  }

  async getTutorById(id) {
    const result = await pool.query(
      `SELECT 
        t.id,
        t.user_id,
        u.full_name as name,
        u.email,
        t.experience_years as experience,
        t.rating,
        t.hourly_rate,
        t.location,
        t.avatar_url,
        t.bio,
        t.education,
        t.phone,
        COALESCE(COUNT(DISTINCT r.id), 0) as reviews_count,
        ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as subjects
      FROM tutors t
      INNER JOIN users u ON t.user_id = u.id
      LEFT JOIN tutor_subjects ts ON t.id = ts.tutor_id
      LEFT JOIN subjects s ON ts.subject_id = s.id
      LEFT JOIN reviews r ON t.id = r.tutor_id
      WHERE t.id = $1 AND u.is_active = true
      GROUP BY t.id, t.user_id, u.full_name, u.email, t.experience_years, t.rating, 
               t.hourly_rate, t.location, t.avatar_url, t.bio, t.education, t.phone`,
      [id]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id.toString(),
      name: row.name,
      email: row.email,
      subjects: row.subjects || [],
      rating: parseFloat(row.rating) || 0,
      reviews: parseInt(row.reviews_count) || 0,
      hourlyRate: parseFloat(row.hourly_rate) || 0,
      experience: row.experience || 0,
      avatar: row.avatar_url || '',
      isOnline: true,
      format: row.location ? ['online', 'offline'] : ['online'],
      location: row.location || undefined,
      availability: [],
      bio: row.bio,
      education: row.education,
      phone: row.phone || undefined
    };
  }

  async getTutorByUserId(userId) {
    const result = await pool.query(
      `SELECT 
        t.id,
        t.user_id,
        u.full_name as name,
        u.email,
        t.experience_years as experience,
        t.rating,
        t.hourly_rate,
        t.location,
        t.avatar_url,
        t.bio,
        t.education,
        t.phone,
        COALESCE(COUNT(DISTINCT r.id), 0) as reviews_count,
        ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as subjects
      FROM tutors t
      INNER JOIN users u ON t.user_id = u.id
      LEFT JOIN tutor_subjects ts ON t.id = ts.tutor_id
      LEFT JOIN subjects s ON ts.subject_id = s.id
      LEFT JOIN reviews r ON t.id = r.tutor_id
      WHERE t.user_id = $1 AND u.is_active = true
      GROUP BY t.id, t.user_id, u.full_name, u.email, t.experience_years, t.rating, 
               t.hourly_rate, t.location, t.avatar_url, t.bio, t.education, t.phone`,
      [userId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id.toString(),
      userId: row.user_id.toString(),
      name: row.name,
      email: row.email,
      subjects: row.subjects || [],
      rating: parseFloat(row.rating) || 0,
      reviews: parseInt(row.reviews_count) || 0,
      hourlyRate: parseFloat(row.hourly_rate) || 0,
      experience: row.experience || 0,
      avatar: row.avatar_url || '',
      isOnline: true,
      format: row.location ? ['online', 'offline'] : ['online'],
      location: row.location || undefined,
      availability: [],
      bio: row.bio,
      education: row.education,
      phone: row.phone || undefined
    };
  }

  async createTutor(userId, tutorData) {
    const result = await pool.query(
      `INSERT INTO tutors (user_id, education, experience_years, bio, rating, hourly_rate, location, avatar_url, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        userId,
        tutorData.education || null,
        tutorData.experienceYears || null,
        tutorData.bio || null,
        tutorData.rating || 0,
        tutorData.hourlyRate || null,
        tutorData.location || null,
        tutorData.avatarUrl || null,
        tutorData.phone || null
      ]
    );

    const tutorId = result.rows[0].id;

    // Добавляем предметы репетитора
    if (tutorData.subjects && tutorData.subjects.length > 0) {
      for (const subjectName of tutorData.subjects) {
        // Находим ID предмета
        const subjectResult = await pool.query(
          `SELECT id FROM subjects WHERE name = $1`,
          [subjectName]
        );

        if (subjectResult.rows.length > 0) {
          const subjectId = subjectResult.rows[0].id;
          await pool.query(
            `INSERT INTO tutor_subjects (tutor_id, subject_id)
             VALUES ($1, $2)
             ON CONFLICT (tutor_id, subject_id) DO NOTHING`,
            [tutorId, subjectId]
          );
        }
      }
    }

    return tutorId;
  }

  async updateTutor(tutorId, tutorData) {
    // Начинаем транзакцию
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Обновляем данные в таблице tutors
      const tutorUpdates = [];
      const tutorValues = [];
      let paramCount = 1;

      if (tutorData.education !== undefined) {
        tutorUpdates.push(`education = $${paramCount++}`);
        tutorValues.push(tutorData.education || null);
      }
      if (tutorData.experienceYears !== undefined) {
        tutorUpdates.push(`experience_years = $${paramCount++}`);
        tutorValues.push(tutorData.experienceYears || null);
      }
      if (tutorData.bio !== undefined) {
        tutorUpdates.push(`bio = $${paramCount++}`);
        tutorValues.push(tutorData.bio || null);
      }
      if (tutorData.hourlyRate !== undefined) {
        tutorUpdates.push(`hourly_rate = $${paramCount++}`);
        tutorValues.push(tutorData.hourlyRate || null);
      }
      if (tutorData.location !== undefined) {
        tutorUpdates.push(`location = $${paramCount++}`);
        tutorValues.push(tutorData.location || null);
      }
      if (tutorData.avatarUrl !== undefined) {
        tutorUpdates.push(`avatar_url = $${paramCount++}`);
        tutorValues.push(tutorData.avatarUrl || null);
      }
      if (tutorData.phone !== undefined) {
        tutorUpdates.push(`phone = $${paramCount++}`);
        tutorValues.push(tutorData.phone || null);
      }

      if (tutorUpdates.length > 0) {
        tutorValues.push(tutorId);
        await client.query(
          `UPDATE tutors SET ${tutorUpdates.join(', ')} WHERE id = $${paramCount}`,
          tutorValues
        );
      }

      // Обновляем имя и email в таблице users
      const userUpdates = [];
      const userValues = [];
      paramCount = 1;

      if (tutorData.fullName !== undefined) {
        userUpdates.push(`full_name = $${paramCount++}`);
        userValues.push(tutorData.fullName);
      }
      if (tutorData.email !== undefined) {
        userUpdates.push(`email = $${paramCount++}`);
        userValues.push(tutorData.email);
      }

      if (userUpdates.length > 0) {
        // Получаем user_id репетитора
        const tutorResult = await client.query(
          `SELECT user_id FROM tutors WHERE id = $1`,
          [tutorId]
        );

        if (tutorResult.rows.length === 0) {
          throw new Error('Tutor not found');
        }

        const userId = tutorResult.rows[0].user_id;
        userUpdates.push(`updated_at = CURRENT_TIMESTAMP`);
        userValues.push(userId);
        await client.query(
          `UPDATE users SET ${userUpdates.join(', ')} WHERE id = $${paramCount}`,
          userValues
        );
      }

      // Обновляем предметы репетитора
      if (tutorData.subjects !== undefined) {
        // Удаляем все существующие предметы
        await client.query(
          `DELETE FROM tutor_subjects WHERE tutor_id = $1`,
          [tutorId]
        );

        // Добавляем новые предметы
        if (tutorData.subjects && tutorData.subjects.length > 0) {
          for (const subjectName of tutorData.subjects) {
            // Находим или создаем предмет
            let subjectResult = await client.query(
              `SELECT id FROM subjects WHERE name = $1`,
              [subjectName]
            );

            let subjectId;
            if (subjectResult.rows.length === 0) {
              // Создаем новый предмет, если его нет
              const newSubjectResult = await client.query(
                `INSERT INTO subjects (name) VALUES ($1) RETURNING id`,
                [subjectName]
              );
              subjectId = newSubjectResult.rows[0].id;
            } else {
              subjectId = subjectResult.rows[0].id;
            }

            // Добавляем связь репетитора с предметом
            await client.query(
              `INSERT INTO tutor_subjects (tutor_id, subject_id)
               VALUES ($1, $2)
               ON CONFLICT (tutor_id, subject_id) DO NOTHING`,
              [tutorId, subjectId]
            );
          }
        }
      }

      await client.query('COMMIT');

      // Возвращаем обновленные данные репетитора
      return await this.getTutorById(tutorId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getStudentsByTutor(tutorId) {
    const result = await pool.query(
      `SELECT 
        u.id as student_id,
        u.full_name as student_name,
        u.email as student_email,
        u.created_at as student_joined,
        COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'COMPLETED') as lessons_completed,
        COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'PLANNED') as lessons_planned,
        MIN(l.date_time) FILTER (WHERE l.status = 'PLANNED' AND l.date_time >= CURRENT_TIMESTAMP) as next_lesson,
        ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as subjects,
        MAX(l.date_time) as last_lesson_date
      FROM lessons l
      INNER JOIN users u ON l.student_id = u.id
      INNER JOIN subjects s ON l.subject_id = s.id
      WHERE l.tutor_id = $1
      GROUP BY u.id, u.full_name, u.email, u.created_at
      ORDER BY last_lesson_date DESC`,
      [tutorId]
    );

    return result.rows.map(row => {
      // Определяем статус на основе последнего урока
      let status = 'active';
      const nextLesson = row.next_lesson;
      const lastLessonDate = row.last_lesson_date ? new Date(row.last_lesson_date) : null;
      const now = new Date();
      
      // Если нет запланированных уроков и последний урок был более 30 дней назад - completed
      if (!nextLesson && lastLessonDate) {
        const daysSinceLastLesson = (now - lastLessonDate) / (1000 * 60 * 60 * 24);
        if (daysSinceLastLesson > 30) {
          status = 'completed';
        } else if (daysSinceLastLesson > 14) {
          status = 'paused';
        }
      } else if (!nextLesson && !lastLessonDate) {
        status = 'paused';
      }

      // Форматируем дату следующего урока
      let nextLessonFormatted = 'Не запланировано';
      if (nextLesson) {
        const nextLessonDate = new Date(nextLesson);
        const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
                       'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
        const day = nextLessonDate.getDate();
        const month = months[nextLessonDate.getMonth()];
        const hours = nextLessonDate.getHours().toString().padStart(2, '0');
        const minutes = nextLessonDate.getMinutes().toString().padStart(2, '0');
        nextLessonFormatted = `${day} ${month}, ${hours}:${minutes}`;
      }

      // Форматируем дату присоединения
      const joinedDate = row.student_joined ? new Date(row.student_joined) : null;
      let joinedFormatted = '';
      if (joinedDate) {
        const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                       'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        joinedFormatted = `${months[joinedDate.getMonth()]} ${joinedDate.getFullYear()}`;
      }

      return {
        id: row.student_id.toString(),
        name: row.student_name,
        email: row.student_email,
        phone: '', // Телефон не хранится в таблице users, можно добавить позже
        subject: row.subjects?.[0] || 'Не указан', // Берем первый предмет
        subjects: row.subjects || [],
        lessonsCompleted: parseInt(row.lessons_completed) || 0,
        lessonsPlanned: parseInt(row.lessons_planned) || 0,
        nextLesson: nextLessonFormatted,
        status: status,
        joined: joinedFormatted || 'Неизвестно'
      };
    });
  }

  async getTutorStats(tutorId, period = 'year') {
    // Определяем период
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
      default:
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Основные метрики
    const metricsResult = await pool.query(
      `SELECT 
        COUNT(DISTINCT l.student_id) FILTER (WHERE l.status = 'COMPLETED' OR l.status = 'PLANNED') as total_students,
        COUNT(*) FILTER (WHERE l.status = 'COMPLETED' AND l.date_time >= $2) as completed_lessons_period,
        COUNT(*) FILTER (WHERE l.status = 'COMPLETED' AND l.date_time >= DATE_TRUNC('month', CURRENT_DATE)) as completed_lessons_month,
        SUM(l.price) FILTER (WHERE l.status = 'COMPLETED' AND l.date_time >= DATE_TRUNC('month', CURRENT_DATE)) as earnings_month,
        AVG(r.rating) as avg_rating
      FROM lessons l
      LEFT JOIN reviews r ON r.tutor_id = l.tutor_id
      WHERE l.tutor_id = $1 AND l.date_time >= $2`,
      [tutorId, startDate]
    );

    const metrics = metricsResult.rows[0];

    // Данные по месяцам для графиков
    const monthlyDataResult = await pool.query(
      `SELECT 
        DATE_TRUNC('month', l.date_time) as month,
        COUNT(DISTINCT l.student_id) FILTER (WHERE l.status IN ('COMPLETED', 'PLANNED')) as students,
        COUNT(*) FILTER (WHERE l.status = 'COMPLETED') as lessons,
        SUM(l.price) FILTER (WHERE l.status = 'COMPLETED') as earnings
      FROM lessons l
      WHERE l.tutor_id = $1 AND l.date_time >= $2
      GROUP BY DATE_TRUNC('month', l.date_time)
      ORDER BY month`,
      [tutorId, startDate]
    );

    // Данные по рейтингу по месяцам
    const ratingDataResult = await pool.query(
      `SELECT 
        DATE_TRUNC('month', r.created_at) as month,
        AVG(r.rating) as rating
      FROM reviews r
      WHERE r.tutor_id = $1 AND r.created_at >= $2
      GROUP BY DATE_TRUNC('month', r.created_at)
      ORDER BY month`,
      [tutorId, startDate]
    );

    // Распределение по предметам
    const subjectDistributionResult = await pool.query(
      `SELECT 
        s.name,
        COUNT(DISTINCT l.student_id) as students,
        COUNT(*) FILTER (WHERE l.status = 'COMPLETED') as lessons_count
      FROM lessons l
      INNER JOIN subjects s ON l.subject_id = s.id
      WHERE l.tutor_id = $1 AND l.date_time >= $2
      GROUP BY s.name
      ORDER BY lessons_count DESC`,
      [tutorId, startDate]
    );

    // Форматируем данные по месяцам
    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    
    const monthlyData = monthlyDataResult.rows.map(row => {
      const date = new Date(row.month);
      return {
        month: monthNames[date.getMonth()],
        students: parseInt(row.students) || 0,
        lessons: parseInt(row.lessons) || 0,
        earnings: parseFloat(row.earnings) || 0
      };
    });

    // Форматируем данные по рейтингу
    const ratingData = ratingDataResult.rows.map(row => {
      const date = new Date(row.month);
      return {
        month: monthNames[date.getMonth()],
        rating: parseFloat(row.rating) || 0
      };
    });

    // Распределение по предметам
    const totalLessons = subjectDistributionResult.rows.reduce((sum, row) => sum + parseInt(row.lessons_count || 0), 0);
    const subjectDistribution = subjectDistributionResult.rows.map(row => ({
      name: row.name,
      value: totalLessons > 0 ? Math.round((parseInt(row.lessons_count || 0) / totalLessons) * 100) : 0,
      students: parseInt(row.students) || 0
    }));

    // Вычисляем изменения (рост)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const previousMonthMetrics = await pool.query(
      `SELECT 
        COUNT(DISTINCT l.student_id) as students,
        COUNT(*) FILTER (WHERE l.status = 'COMPLETED') as lessons,
        SUM(l.price) FILTER (WHERE l.status = 'COMPLETED') as earnings
      FROM lessons l
      WHERE l.tutor_id = $1 
        AND l.date_time >= $2 
        AND l.date_time < $3`,
      [tutorId, previousMonthStart, currentMonthStart]
    );

    const currentMonthMetrics = await pool.query(
      `SELECT 
        COUNT(DISTINCT l.student_id) as students,
        COUNT(*) FILTER (WHERE l.status = 'COMPLETED') as lessons,
        SUM(l.price) FILTER (WHERE l.status = 'COMPLETED') as earnings
      FROM lessons l
      WHERE l.tutor_id = $1 
        AND l.date_time >= $2`,
      [tutorId, currentMonthStart]
    );

    const prev = previousMonthMetrics.rows[0];
    const curr = currentMonthMetrics.rows[0];

    const calculateGrowth = (current, previous) => {
      if (!previous || previous == 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      totalStudents: parseInt(metrics.total_students) || 0,
      lessonsThisMonth: parseInt(metrics.completed_lessons_month) || 0,
      earningsThisMonth: parseFloat(metrics.earnings_month) || 0,
      avgRating: parseFloat(metrics.avg_rating) || 0,
      growth: {
        students: calculateGrowth(parseInt(curr?.students || 0), parseInt(prev?.students || 0)),
        lessons: calculateGrowth(parseInt(curr?.lessons || 0), parseInt(prev?.lessons || 0)),
        earnings: calculateGrowth(parseFloat(curr?.earnings || 0), parseFloat(prev?.earnings || 0)),
        rating: 0 // Рейтинг обычно не растет так быстро
      },
      monthlyData,
      ratingData,
      subjectDistribution
    };
  }
}

