import { pool } from '../config/database.js';

export class LessonService {
  async createLesson(data) {
    const { tutorId, studentId, subjectId, dateTime, duration = 60, price } = data;

    // Проверяем, не занят ли слот (игнорируем отмененные и отклоненные уроки)
    const existingLesson = await pool.query(
      `SELECT id FROM lessons 
       WHERE tutor_id = $1 
         AND date_time = $2 
         AND status NOT IN ('CANCELLED', 'REJECTED')`,
      [tutorId, dateTime]
    );

    if (existingLesson.rows.length > 0) {
      throw new Error('Это время уже занято');
    }

    // Создаем урок со статусом PENDING (ожидает одобрения репетитора)
    const result = await pool.query(
      `INSERT INTO lessons (tutor_id, student_id, subject_id, date_time, duration, price, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
       RETURNING id, tutor_id, student_id, subject_id, date_time, duration, price, status`,
      [tutorId, studentId, subjectId, dateTime, duration, price]
    );

    return result.rows[0];
  }

  async getLessonsByStudent(studentId) {
    const result = await pool.query(
      `SELECT 
        l.id,
        l.date_time,
        l.duration,
        l.price,
        l.status,
        t.id as tutor_id,
        u.full_name as tutor_name,
        s.name as subject_name
      FROM lessons l
      INNER JOIN tutors t ON l.tutor_id = t.id
      INNER JOIN users u ON t.user_id = u.id
      INNER JOIN subjects s ON l.subject_id = s.id
      WHERE l.student_id = $1
      ORDER BY l.date_time DESC`,
      [studentId]
    );

    return result.rows.map(row => ({
      id: row.id.toString(),
      tutorId: row.tutor_id.toString(),
      tutorName: row.tutor_name,
      subjectName: row.subject_name,
      dateTime: row.date_time,
      duration: row.duration,
      price: parseFloat(row.price) || 0,
      status: row.status
    }));
  }

  async getLessonsByTutor(tutorId) {
    const result = await pool.query(
      `SELECT 
        l.id,
        l.date_time,
        l.duration,
        l.price,
        l.status,
        u.full_name as student_name,
        s.name as subject_name
      FROM lessons l
      INNER JOIN users u ON l.student_id = u.id
      INNER JOIN subjects s ON l.subject_id = s.id
      WHERE l.tutor_id = $1
      ORDER BY l.date_time DESC`,
      [tutorId]
    );

    return result.rows.map(row => ({
      id: row.id.toString(),
      studentName: row.student_name,
      subjectName: row.subject_name,
      dateTime: row.date_time,
      duration: row.duration,
      price: parseFloat(row.price) || 0,
      status: row.status
    }));
  }

  async cancelLesson(lessonId) {
    // Проверяем, существует ли урок
    const lessonResult = await pool.query(
      `SELECT id, status FROM lessons WHERE id = $1`,
      [lessonId]
    );

    if (lessonResult.rows.length === 0) {
      throw new Error('Урок не найден');
    }

    const lesson = lessonResult.rows[0];

    // Проверяем, не отменен ли уже урок
    if (lesson.status === 'CANCELLED') {
      throw new Error('Урок уже отменен');
    }

    // Обновляем статус на CANCELLED
    const result = await pool.query(
      `UPDATE lessons 
       SET status = 'CANCELLED' 
       WHERE id = $1 
       RETURNING id, tutor_id, student_id, subject_id, date_time, duration, price, status`,
      [lessonId]
    );

    return result.rows[0];
  }

  // Одобрить урок (изменить статус с PENDING на APPROVED)
  async approveLesson(lessonId, tutorId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Проверяем, существует ли урок и принадлежит ли он репетитору
      const lessonResult = await client.query(
        `SELECT id, status, tutor_id FROM lessons WHERE id = $1`,
        [lessonId]
      );

      if (lessonResult.rows.length === 0) {
        throw new Error('Урок не найден');
      }

      const lesson = lessonResult.rows[0];

      // Проверяем, что урок принадлежит репетитору
      if (lesson.tutor_id.toString() !== tutorId.toString()) {
        throw new Error('Урок не принадлежит этому репетитору');
      }

      // Проверяем, что урок в статусе PENDING
      if (lesson.status !== 'PENDING') {
        throw new Error(`Урок уже обработан. Текущий статус: ${lesson.status}`);
      }

      // Обновляем статус на APPROVED
      const result = await client.query(
        `UPDATE lessons 
         SET status = 'APPROVED' 
         WHERE id = $1 
         RETURNING id, tutor_id, student_id, subject_id, date_time, duration, price, status`,
        [lessonId]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Отклонить урок (изменить статус с PENDING на REJECTED)
  async rejectLesson(lessonId, tutorId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Проверяем, существует ли урок и принадлежит ли он репетитору
      const lessonResult = await client.query(
        `SELECT id, status, tutor_id FROM lessons WHERE id = $1`,
        [lessonId]
      );

      if (lessonResult.rows.length === 0) {
        throw new Error('Урок не найден');
      }

      const lesson = lessonResult.rows[0];

      // Проверяем, что урок принадлежит репетитору
      if (lesson.tutor_id.toString() !== tutorId.toString()) {
        throw new Error('Урок не принадлежит этому репетитору');
      }

      // Проверяем, что урок в статусе PENDING
      if (lesson.status !== 'PENDING') {
        throw new Error(`Урок уже обработан. Текущий статус: ${lesson.status}`);
      }

      // Обновляем статус на REJECTED
      const result = await client.query(
        `UPDATE lessons 
         SET status = 'REJECTED' 
         WHERE id = $1 
         RETURNING id, tutor_id, student_id, subject_id, date_time, duration, price, status`,
        [lessonId]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

