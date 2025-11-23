import { pool } from '../config/database.js';

export class AdminService {
  // Получить общую статистику платформы
  async getPlatformStats(period = 'year') {
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

    // Общее количество репетиторов
    const tutorsResult = await pool.query(
      `SELECT COUNT(*) as total FROM tutors t
       INNER JOIN users u ON t.user_id = u.id
       WHERE u.is_active = true`
    );
    const totalTutors = parseInt(tutorsResult.rows[0].total) || 0;

    // Количество репетиторов за период
    const tutorsPeriodResult = await pool.query(
      `SELECT COUNT(*) as total FROM tutors t
       INNER JOIN users u ON t.user_id = u.id
       WHERE u.is_active = true AND u.created_at >= $1`,
      [startDate]
    );
    const tutorsPeriod = parseInt(tutorsPeriodResult.rows[0].total) || 0;

    // Общее количество студентов
    const studentsResult = await pool.query(
      `SELECT COUNT(*) as total FROM users
       WHERE role = 'STUDENT' AND is_active = true`
    );
    const totalStudents = parseInt(studentsResult.rows[0].total) || 0;

    // Количество студентов за период
    const studentsPeriodResult = await pool.query(
      `SELECT COUNT(*) as total FROM users
       WHERE role = 'STUDENT' AND is_active = true AND created_at >= $1`,
      [startDate]
    );
    const studentsPeriod = parseInt(studentsPeriodResult.rows[0].total) || 0;

    // Занятия за текущий месяц
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lessonsMonthResult = await pool.query(
      `SELECT COUNT(*) as total FROM lessons
       WHERE status = 'COMPLETED' AND date_time >= $1`,
      [currentMonthStart]
    );
    const lessonsThisMonth = parseInt(lessonsMonthResult.rows[0].total) || 0;

    // Занятия за предыдущий месяц
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
    const lessonsPrevMonthResult = await pool.query(
      `SELECT COUNT(*) as total FROM lessons
       WHERE status = 'COMPLETED' AND date_time >= $1 AND date_time < $2`,
      [previousMonthStart, previousMonthEnd]
    );
    const lessonsPrevMonth = parseInt(lessonsPrevMonthResult.rows[0].total) || 0;

    // Комиссия за текущий месяц (10% от выручки)
    const commissionMonthResult = await pool.query(
      `SELECT COALESCE(SUM(price * 0.1), 0) as commission FROM lessons
       WHERE status = 'COMPLETED' AND date_time >= $1`,
      [currentMonthStart]
    );
    const commissionThisMonth = parseFloat(commissionMonthResult.rows[0].commission) || 0;

    // Комиссия за предыдущий месяц
    const commissionPrevMonthResult = await pool.query(
      `SELECT COALESCE(SUM(price * 0.1), 0) as commission FROM lessons
       WHERE status = 'COMPLETED' AND date_time >= $1 AND date_time < $2`,
      [previousMonthStart, previousMonthEnd]
    );
    const commissionPrevMonth = parseFloat(commissionPrevMonthResult.rows[0].commission) || 0;

    // Вычисляем процент роста
    const calculateGrowth = (current, previous) => {
      if (!previous || previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      totalTutors,
      tutorsGrowth: calculateGrowth(totalTutors, totalTutors - tutorsPeriod),
      totalStudents,
      studentsGrowth: calculateGrowth(totalStudents, totalStudents - studentsPeriod),
      lessonsThisMonth,
      lessonsGrowth: calculateGrowth(lessonsThisMonth, lessonsPrevMonth),
      commissionThisMonth,
      commissionGrowth: calculateGrowth(commissionThisMonth, commissionPrevMonth)
    };
  }

  // Получить данные роста платформы по месяцам
  async getPlatformGrowth(period = 'year') {
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

    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

    // Данные по репетиторам по месяцам
    const tutorsMonthlyResult = await pool.query(
      `SELECT 
        DATE_TRUNC('month', u.created_at) as month,
        COUNT(*) as count
       FROM tutors t
       INNER JOIN users u ON t.user_id = u.id
       WHERE u.is_active = true AND u.created_at >= $1
       GROUP BY DATE_TRUNC('month', u.created_at)
       ORDER BY month`,
      [startDate]
    );

    // Данные по студентам по месяцам
    const studentsMonthlyResult = await pool.query(
      `SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as count
       FROM users
       WHERE role = 'STUDENT' AND is_active = true AND created_at >= $1
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY month`,
      [startDate]
    );

    // Данные по занятиям по месяцам
    const lessonsMonthlyResult = await pool.query(
      `SELECT 
        DATE_TRUNC('month', date_time) as month,
        COUNT(*) as count
       FROM lessons
       WHERE status = 'COMPLETED' AND date_time >= $1
       GROUP BY DATE_TRUNC('month', date_time)
       ORDER BY month`,
      [startDate]
    );

    // Создаем карту для накопления данных
    const dataMap = new Map();

    // Инициализируем все месяцы в периоде
    const currentDate = new Date(startDate);
    while (currentDate <= now) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const monthName = monthNames[currentDate.getMonth()];
      dataMap.set(monthKey, {
        month: monthName,
        tutors: 0,
        students: 0,
        lessons: 0
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Добавляем данные по репетиторам
    tutorsMonthlyResult.rows.forEach(row => {
      const date = new Date(row.month);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (dataMap.has(monthKey)) {
        dataMap.get(monthKey).tutors = parseInt(row.count) || 0;
      }
    });

    // Добавляем данные по студентам
    studentsMonthlyResult.rows.forEach(row => {
      const date = new Date(row.month);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (dataMap.has(monthKey)) {
        dataMap.get(monthKey).students = parseInt(row.count) || 0;
      }
    });

    // Добавляем данные по занятиям
    lessonsMonthlyResult.rows.forEach(row => {
      const date = new Date(row.month);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (dataMap.has(monthKey)) {
        dataMap.get(monthKey).lessons = parseInt(row.count) || 0;
      }
    });

    // Накопление значений (кумулятивная сумма)
    // Сначала получаем начальные значения (до периода)
    const tutorsBeforeResult = await pool.query(
      `SELECT COUNT(*) as count FROM tutors t
       INNER JOIN users u ON t.user_id = u.id
       WHERE u.is_active = true AND u.created_at < $1`,
      [startDate]
    );
    let tutorsCumulative = parseInt(tutorsBeforeResult.rows[0].count) || 0;

    const studentsBeforeResult = await pool.query(
      `SELECT COUNT(*) as count FROM users
       WHERE role = 'STUDENT' AND is_active = true AND created_at < $1`,
      [startDate]
    );
    let studentsCumulative = parseInt(studentsBeforeResult.rows[0].count) || 0;

    let lessonsCumulative = 0; // Занятия не накапливаем, показываем по месяцам

    const result = Array.from(dataMap.values()).map(item => {
      tutorsCumulative += item.tutors;
      studentsCumulative += item.students;
      lessonsCumulative += item.lessons; // Для занятий накапливаем
      return {
        month: item.month,
        tutors: tutorsCumulative,
        students: studentsCumulative,
        lessons: lessonsCumulative
      };
    });

    return result;
  }

  // Получить данные по выручке
  async getRevenueData(period = 'year') {
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

    const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];

    const revenueResult = await pool.query(
      `SELECT 
        DATE_TRUNC('month', date_time) as month,
        COALESCE(SUM(price), 0) as revenue,
        COALESCE(SUM(price * 0.1), 0) as commission
       FROM lessons
       WHERE status = 'COMPLETED' AND date_time >= $1
       GROUP BY DATE_TRUNC('month', date_time)
       ORDER BY month`,
      [startDate]
    );

    // Создаем карту для всех месяцев
    const dataMap = new Map();
    const currentDate = new Date(startDate);
    while (currentDate <= now) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const monthName = monthNames[currentDate.getMonth()];
      dataMap.set(monthKey, {
        month: monthName,
        revenue: 0,
        commission: 0
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Заполняем данными
    revenueResult.rows.forEach(row => {
      const date = new Date(row.month);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (dataMap.has(monthKey)) {
        dataMap.get(monthKey).revenue = parseFloat(row.revenue) || 0;
        dataMap.get(monthKey).commission = parseFloat(row.commission) || 0;
      }
    });

    return Array.from(dataMap.values());
  }

  // Получить популярность предметов
  async getSubjectPopularity() {
    const result = await pool.query(
      `SELECT 
        s.name as subject,
        COUNT(DISTINCT t.id) as tutors,
        COUNT(DISTINCT l.student_id) as students,
        COALESCE(AVG(r.rating), 0) as avg_rating
       FROM subjects s
       LEFT JOIN tutor_subjects ts ON s.id = ts.subject_id
       LEFT JOIN tutors t ON ts.tutor_id = t.id
       LEFT JOIN lessons l ON l.subject_id = s.id AND l.status = 'COMPLETED'
       LEFT JOIN reviews r ON r.tutor_id = t.id
       GROUP BY s.id, s.name
       HAVING COUNT(DISTINCT t.id) > 0
       ORDER BY tutors DESC, students DESC`
    );

    return result.rows.map(row => ({
      subject: row.subject,
      tutors: parseInt(row.tutors) || 0,
      students: parseInt(row.students) || 0,
      avgRating: parseFloat(row.avg_rating) || 0
    }));
  }

  // Получить распределение по городам
  async getCityDistribution() {
    const result = await pool.query(
      `SELECT 
        COALESCE(t.location, 'Не указан') as city,
        COUNT(DISTINCT t.id) as tutors
       FROM tutors t
       INNER JOIN users u ON t.user_id = u.id
       WHERE u.is_active = true AND t.location IS NOT NULL AND t.location != ''
       GROUP BY t.location
       ORDER BY tutors DESC
       LIMIT 10`
    );

    const total = result.rows.reduce((sum, row) => sum + parseInt(row.tutors), 0);

    return result.rows.map((row, index) => ({
      name: row.city,
      value: total > 0 ? Math.round((parseInt(row.tutors) / total) * 100) : 0,
      tutors: parseInt(row.tutors) || 0
    }));
  }

  // Получить топ репетиторов
  async getTopTutors(limit = 10) {
    const result = await pool.query(
      `SELECT 
        t.id,
        u.full_name as name,
        s.name as subject,
        t.rating,
        COUNT(DISTINCT l.student_id) as students,
        COUNT(*) FILTER (WHERE l.status = 'COMPLETED') as lessons,
        COALESCE(SUM(l.price) FILTER (WHERE l.status = 'COMPLETED'), 0) as earnings
       FROM tutors t
       INNER JOIN users u ON t.user_id = u.id
       LEFT JOIN tutor_subjects ts ON t.id = ts.tutor_id
       LEFT JOIN subjects s ON ts.subject_id = s.id
       LEFT JOIN lessons l ON l.tutor_id = t.id
       WHERE u.is_active = true
       GROUP BY t.id, u.full_name, s.name, t.rating
       ORDER BY t.rating DESC, lessons DESC, students DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name,
      subject: row.subject || 'Не указан',
      rating: parseFloat(row.rating) || 0,
      students: parseInt(row.students) || 0,
      lessons: parseInt(row.lessons) || 0,
      earnings: parseFloat(row.earnings) || 0
    }));
  }

  // Получить общую статистику по выручке
  async getRevenueStats(period = 'year') {
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

    // Общая выручка за период
    const totalRevenueResult = await pool.query(
      `SELECT COALESCE(SUM(price), 0) as revenue FROM lessons
       WHERE status = 'COMPLETED' AND date_time >= $1`,
      [startDate]
    );
    const totalRevenue = parseFloat(totalRevenueResult.rows[0].revenue) || 0;

    // Общая комиссия за период
    const totalCommission = totalRevenue * 0.1;

    // Средний чек
    const avgCheckResult = await pool.query(
      `SELECT COALESCE(AVG(price), 0) as avg_check FROM lessons
       WHERE status = 'COMPLETED' AND date_time >= $1`,
      [startDate]
    );
    const avgCheck = parseFloat(avgCheckResult.rows[0].avg_check) || 0;

    // Выручка за предыдущий период для сравнения
    const previousPeriodStart = new Date(startDate);
    const previousPeriodEnd = new Date(startDate);
    
    switch (period) {
      case 'week':
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
        break;
      case 'month':
        previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
        break;
      case 'quarter':
        previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 3);
        break;
      case 'year':
      default:
        previousPeriodStart.setFullYear(previousPeriodStart.getFullYear() - 1);
        break;
    }

    const prevRevenueResult = await pool.query(
      `SELECT COALESCE(SUM(price), 0) as revenue FROM lessons
       WHERE status = 'COMPLETED' AND date_time >= $1 AND date_time < $2`,
      [previousPeriodStart, previousPeriodEnd]
    );
    const prevRevenue = parseFloat(prevRevenueResult.rows[0].revenue) || 0;
    const prevCommission = prevRevenue * 0.1;

    const calculateGrowth = (current, previous) => {
      if (!previous || previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      totalRevenue,
      totalCommission,
      avgCheck,
      revenueGrowth: calculateGrowth(totalRevenue, prevRevenue),
      commissionGrowth: calculateGrowth(totalCommission, prevCommission)
    };
  }
}

