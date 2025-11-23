import { pool } from '../config/database.js';

export class ScheduleService {
  // Получить шаблон расписания репетитора (дни недели + время)
  async getScheduleTemplate(tutorId) {
    const result = await pool.query(
      `SELECT 
        id,
        day_of_week,
        start_time,
        end_time,
        is_available
      FROM schedule_slots
      WHERE tutor_id = $1
      ORDER BY 
        CASE day_of_week
          WHEN 'MONDAY' THEN 1
          WHEN 'TUESDAY' THEN 2
          WHEN 'WEDNESDAY' THEN 3
          WHEN 'THURSDAY' THEN 4
          WHEN 'FRIDAY' THEN 5
          WHEN 'SATURDAY' THEN 6
          WHEN 'SUNDAY' THEN 7
        END,
        start_time`,
      [tutorId]
    );

    return result.rows.map(row => ({
      id: row.id,
      dayOfWeek: row.day_of_week,
      startTime: row.start_time,
      endTime: row.end_time,
      isAvailable: row.is_available
    }));
  }

  // Получить доступные слоты на ближайшие N дней с учетом занятости
  async getAvailableSlots(tutorId, daysAhead = 14) {
    // Получаем активные шаблоны слотов
    const templates = await this.getScheduleTemplate(tutorId);
    const activeTemplates = templates.filter(t => t.isAvailable);

    if (activeTemplates.length === 0) {
      return [];
    }

    // Получаем все занятые уроки на ближайшие дни
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + daysAhead);

    const bookedLessons = await pool.query(
      `SELECT 
        date_time,
        status
      FROM lessons
      WHERE tutor_id = $1
        AND date_time >= $2
        AND date_time < $3
        AND status != 'CANCELLED'
      ORDER BY date_time`,
      [tutorId, startDate, endDate]
    );

    // Создаем Set для быстрой проверки занятости
    const bookedTimes = new Set();
    bookedLessons.rows.forEach(lesson => {
      const lessonDate = new Date(lesson.date_time);
      const timeKey = `${lessonDate.toISOString().split('T')[0]}_${lessonDate.toTimeString().slice(0, 5)}`;
      bookedTimes.add(timeKey);
    });

    // Генерируем доступные слоты
    const availableSlots = [];
    const dayMapping = {
      'MONDAY': 1,
      'TUESDAY': 2,
      'WEDNESDAY': 3,
      'THURSDAY': 4,
      'FRIDAY': 5,
      'SATURDAY': 6,
      'SUNDAY': 0
    };

    for (let i = 0; i < daysAhead; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Находим шаблоны для этого дня недели
      const dayName = Object.keys(dayMapping).find(
        key => dayMapping[key] === dayOfWeek
      );

      if (!dayName) continue;

      const dayTemplates = activeTemplates.filter(t => t.dayOfWeek === dayName);

      for (const template of dayTemplates) {
        const [hours, minutes] = template.startTime.split(':').map(Number);
        const slotDateTime = new Date(currentDate);
        slotDateTime.setHours(hours, minutes, 0, 0);

        // Проверяем, что слот в будущем
        if (slotDateTime < new Date()) {
          continue;
        }

        // Проверяем, не занят ли слот
        const dateKey = currentDate.toISOString().split('T')[0];
        const timeStr = template.startTime.slice(0, 5); // Берем только HH:MM
        const timeKey = `${dateKey}_${timeStr}`;

        if (!bookedTimes.has(timeKey)) {
          availableSlots.push({
            id: `${template.id}_${dateKey}_${timeStr}`,
            slotId: template.id,
            date: dateKey,
            dayOfWeek: dayName,
            startTime: timeStr,
            endTime: template.endTime.slice(0, 5),
            dateTime: slotDateTime.toISOString()
          });
        }
      }
    }

    // Сортируем по дате и времени
    availableSlots.sort((a, b) => {
      const dateA = new Date(a.dateTime);
      const dateB = new Date(b.dateTime);
      return dateA - dateB;
    });

    return availableSlots;
  }

  // Создать расписание по умолчанию для репетитора
  async createDefaultSchedule(tutorId) {
    // Удаляем старое расписание
    await pool.query(
      `DELETE FROM schedule_slots WHERE tutor_id = $1`,
      [tutorId]
    );

    // Создаем слоты: Пн-Пт, 9:00-18:00, по 60 минут
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    const startHour = 9;
    const endHour = 18;

    for (const day of days) {
      for (let hour = startHour; hour < endHour; hour++) {
        const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`;

        await pool.query(
          `INSERT INTO schedule_slots (tutor_id, day_of_week, start_time, end_time, is_available)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (tutor_id, day_of_week, start_time) DO UPDATE SET
             end_time = EXCLUDED.end_time,
             is_available = EXCLUDED.is_available`,
          [tutorId, day, startTime, endTime, true]
        );
      }
    }
  }

  // Обновить расписание репетитора
  async updateSchedule(tutorId, slots) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Удаляем старые слоты
      await client.query(
        `DELETE FROM schedule_slots WHERE tutor_id = $1`,
        [tutorId]
      );

      // Добавляем новые слоты
      for (const slot of slots) {
        await client.query(
          `INSERT INTO schedule_slots (tutor_id, day_of_week, start_time, end_time, is_available)
           VALUES ($1, $2, $3, $4, $5)`,
          [tutorId, slot.dayOfWeek, slot.startTime, slot.endTime, slot.isAvailable ?? true]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

