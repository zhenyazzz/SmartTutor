import { pool } from '../config/database.js';
import bcrypt from 'bcryptjs';

export class UserService {
  async createUser(data) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, role, created_at`,
      [data.fullName, data.email, passwordHash, data.role, true]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      role: row.role,
      createdAt: row.created_at
    };
  }

  async getUserById(id) {
    // Преобразуем ID в число, если это строка
    const userId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    const result = await pool.query(
      `SELECT id, full_name, email, role, created_at, is_active
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      console.log(`[UserService] getUserById: User not found with id: ${userId} (original: ${id}, type: ${typeof id})`);
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      role: row.role,
      createdAt: row.created_at,
      isActive: row.is_active
    };
  }

  async getUserByEmail(email) {
    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isActive: row.is_active
    };
  }

  async getAllUsers() {
    const result = await pool.query(
      `SELECT id, full_name, email, role, created_at
       FROM users WHERE is_active = true
       ORDER BY created_at DESC`
    );

    return result.rows.map(row => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      role: row.role,
      createdAt: row.created_at
    }));
  }

  // Получить всех пользователей с детальной информацией для админ-панели
  async getAllUsersForAdmin() {
    const result = await pool.query(
      `SELECT 
        u.id,
        u.full_name,
        u.email,
        u.role,
        u.created_at,
        u.is_active,
        t.phone,
        t.avatar_url,
        COUNT(DISTINCT CASE WHEN u.role = 'TUTOR' AND l_tutor.status = 'COMPLETED' THEN l_tutor.id END) as tutor_lessons,
        COUNT(DISTINCT CASE WHEN u.role = 'TUTOR' AND l_tutor.status IN ('COMPLETED', 'PLANNED') THEN l_tutor.student_id END) as students_count,
        COALESCE(SUM(CASE WHEN u.role = 'TUTOR' AND l_tutor.status = 'COMPLETED' THEN l_tutor.price END), 0) as earnings,
        COUNT(DISTINCT CASE WHEN u.role = 'STUDENT' AND l_student.status = 'COMPLETED' THEN l_student.id END) as student_lessons
       FROM users u
       LEFT JOIN tutors t ON u.id = t.user_id
       LEFT JOIN lessons l_tutor ON u.role = 'TUTOR' AND l_tutor.tutor_id = t.id
       LEFT JOIN lessons l_student ON u.role = 'STUDENT' AND l_student.student_id = u.id
       GROUP BY u.id, u.full_name, u.email, u.role, u.created_at, u.is_active, t.phone, t.avatar_url
       ORDER BY u.created_at DESC`
    );

    return result.rows.map(row => {
      const user = {
        id: row.id.toString(),
        name: row.full_name,
        email: row.email,
        role: row.role.toLowerCase(),
        status: row.is_active ? 'active' : 'suspended',
        joinedDate: row.created_at,
        phone: row.phone || '',
        avatar: row.avatar_url || '',
        verified: true, // Можно добавить поле verified в будущем
        lastActive: 'Недавно' // Можно добавить отслеживание последней активности
      };

      // Добавляем статистику для репетиторов
      if (row.role === 'TUTOR') {
        user.stats = {
          lessons: parseInt(row.tutor_lessons) || 0,
          students: parseInt(row.students_count) || 0,
          earnings: parseFloat(row.earnings) || 0
        };
      } else if (row.role === 'STUDENT') {
        user.stats = {
          lessons: parseInt(row.student_lessons) || 0
        };
      }

      return user;
    });
  }

  // Получить детальную информацию о пользователе
  async getUserDetailsForAdmin(userId) {
    const userResult = await pool.query(
      `SELECT 
        u.id,
        u.full_name,
        u.email,
        u.role,
        u.created_at,
        u.is_active,
        t.phone,
        t.avatar_url,
        t.bio,
        t.education,
        t.location,
        t.hourly_rate,
        t.rating
       FROM users u
       LEFT JOIN tutors t ON u.id = t.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) return null;

    const row = userResult.rows[0];
    const user = {
      id: row.id.toString(),
      name: row.full_name,
      email: row.email,
      role: row.role.toLowerCase(),
      status: row.is_active ? 'active' : 'suspended',
      joinedDate: row.created_at,
      phone: row.phone || '',
      avatar: row.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      verified: true,
      lastActive: 'Недавно'
    };

    // Добавляем дополнительную информацию для репетиторов
    if (row.role === 'TUTOR') {
      user.bio = row.bio;
      user.education = row.education;
      user.location = row.location;
      user.hourlyRate = parseFloat(row.hourly_rate) || 0;
      user.rating = parseFloat(row.rating) || 0;

      // Получаем статистику
      const statsResult = await pool.query(
        `SELECT 
          COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'COMPLETED') as lessons_completed,
          COUNT(DISTINCT l.student_id) FILTER (WHERE l.status IN ('COMPLETED', 'PLANNED')) as students_count,
          COALESCE(SUM(l.price) FILTER (WHERE l.status = 'COMPLETED'), 0) as earnings
         FROM lessons l
         WHERE l.tutor_id = (SELECT id FROM tutors WHERE user_id = $1)`,
        [userId]
      );

      if (statsResult.rows.length > 0) {
        user.stats = {
          lessons: parseInt(statsResult.rows[0].lessons_completed) || 0,
          students: parseInt(statsResult.rows[0].students_count) || 0,
          earnings: parseFloat(statsResult.rows[0].earnings) || 0
        };
      }
    } else if (row.role === 'STUDENT') {
      // Получаем статистику для студентов
      const statsResult = await pool.query(
        `SELECT COUNT(*) as lessons_completed
         FROM lessons
         WHERE student_id = $1 AND status = 'COMPLETED'`,
        [userId]
      );

      if (statsResult.rows.length > 0) {
        user.stats = {
          lessons: parseInt(statsResult.rows[0].lessons_completed) || 0
        };
      }
    }

    return user;
  }

  // Блокировать/активировать пользователя
  async toggleUserStatus(userId, isActive) {
    const result = await pool.query(
      `UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, full_name, email, role, is_active`,
      [isActive, userId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      role: row.role,
      isActive: row.is_active
    };
  }

  async updateUser(id, data) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const updates = [];
      const values = [];
      let paramCount = 1;

      if (data.fullName) {
        updates.push(`full_name = $${paramCount++}`);
        values.push(data.fullName);
      }
      if (data.email) {
        updates.push(`email = $${paramCount++}`);
        values.push(data.email);
      }
      if (data.password) {
        const passwordHash = await bcrypt.hash(data.password, 10);
        updates.push(`password_hash = $${paramCount++}`);
        values.push(passwordHash);
      }
      if (data.role) {
        updates.push(`role = $${paramCount++}`);
        values.push(data.role);
      }

      // Обновляем users, если есть изменения
      if (updates.length > 0) {
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const result = await client.query(
          `UPDATE users SET ${updates.join(', ')}
           WHERE id = $${paramCount}
           RETURNING id, full_name, email, role, created_at`,
          values
        );

        if (result.rows.length === 0) {
          await client.query('ROLLBACK');
          return null;
        }
      }

      // Обновляем телефон в таблице tutors, если пользователь является репетитором
      if (data.phone !== undefined) {
        // Проверяем, является ли пользователь репетитором
        const tutorCheck = await client.query(
          `SELECT id FROM tutors WHERE user_id = $1`,
          [id]
        );

        if (tutorCheck.rows.length > 0) {
          // Обновляем телефон в таблице tutors
          await client.query(
            `UPDATE tutors SET phone = $1 WHERE user_id = $2`,
            [data.phone || null, id]
          );
        }
      }

      await client.query('COMMIT');

      // Возвращаем обновленные данные пользователя
      const userResult = await client.query(
        `SELECT id, full_name, email, role, created_at FROM users WHERE id = $1`,
        [id]
      );

      if (userResult.rows.length === 0) return null;

      const row = userResult.rows[0];
      return {
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        role: row.role,
        createdAt: row.created_at
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteUser(id) {
    const result = await pool.query(
      `UPDATE users SET is_active = false WHERE id = $1`,
      [id]
    );
    return result.rowCount > 0;
  }
}

