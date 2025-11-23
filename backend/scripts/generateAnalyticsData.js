import { pool } from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Генерирует исторические данные уроков за последний год для всех репетиторов
 * для создания красивой аналитики
 */
async function generateAnalyticsData() {
  try {
    console.log('🚀 Starting analytics data generation...\n');

    // Получаем всех репетиторов
    const tutorsResult = await pool.query(
      `SELECT t.id, t.hourly_rate, u.email
       FROM tutors t
       INNER JOIN users u ON t.user_id = u.id
       WHERE u.is_active = true`
    );

    if (tutorsResult.rows.length === 0) {
      console.log('⚠ No tutors found. Please run seedUsers.js first.');
      process.exit(0);
    }

    console.log(`📊 Found ${tutorsResult.rows.length} tutors\n`);

    // Получаем всех студентов
    const studentsResult = await pool.query(
      `SELECT id FROM users WHERE role = 'STUDENT' AND is_active = true`
    );

    if (studentsResult.rows.length === 0) {
      console.log('⚠ No students found. Please run seedUsers.js first.');
      process.exit(0);
    }

    const students = studentsResult.rows.map(r => r.id);
    console.log(`👨‍🎓 Found ${students.length} students\n`);

    // Получаем предметы
    const subjectsResult = await pool.query(`SELECT id, name FROM subjects`);
    const subjects = subjectsResult.rows;
    const subjectMap = {};
    subjects.forEach(s => {
      subjectMap[s.name] = s.id;
    });

    let totalLessonsCreated = 0;

    // Для каждого репетитора генерируем исторические данные
    for (const tutor of tutorsResult.rows) {
      const tutorId = tutor.id;
      const hourlyRate = parseFloat(tutor.hourly_rate) || 1500;

      // Получаем предметы репетитора
      const tutorSubjectsResult = await pool.query(
        `SELECT s.id, s.name 
         FROM tutor_subjects ts
         INNER JOIN subjects s ON ts.subject_id = s.id
         WHERE ts.tutor_id = $1`,
        [tutorId]
      );

      if (tutorSubjectsResult.rows.length === 0) {
        console.log(`  ⚠ Tutor ${tutor.email} has no subjects, skipping...`);
        continue;
      }

      const tutorSubjects = tutorSubjectsResult.rows;
      const tutorSubjectIds = tutorSubjects.map(s => s.id);

      // Генерируем данные за последние 12 месяцев
      const now = new Date();
      const monthsToGenerate = 12;
      let lessonsCreatedForTutor = 0;

      // Распределяем студентов по месяцам (рост базы учеников)
      const studentsPerMonth = Math.ceil(students.length / monthsToGenerate);
      let currentStudentIndex = 0;

      for (let monthOffset = monthsToGenerate - 1; monthOffset >= 0; monthOffset--) {
        const targetDate = new Date(now);
        targetDate.setMonth(targetDate.getMonth() - monthOffset);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth() + 1; // 1-12

        // Количество уникальных студентов в этом месяце (растущее)
        const studentsThisMonth = Math.min(
          studentsPerMonth * (monthsToGenerate - monthOffset),
          students.length
        );

        // Количество уроков в этом месяце (растущее)
        const baseLessonsPerMonth = 20 + (monthsToGenerate - monthOffset) * 5;
        const lessonsThisMonth = baseLessonsPerMonth + Math.floor(Math.random() * 10);

        // Выбираем случайных студентов для этого месяца
        const selectedStudents = [];
        const shuffledStudents = [...students].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < Math.min(studentsThisMonth, shuffledStudents.length); i++) {
          selectedStudents.push(shuffledStudents[i]);
        }

        // Генерируем уроки для этого месяца
        for (let i = 0; i < lessonsThisMonth; i++) {
          const studentId = selectedStudents[Math.floor(Math.random() * selectedStudents.length)];
          const subjectId = tutorSubjectIds[Math.floor(Math.random() * tutorSubjectIds.length)];

          // Случайный день в месяце
          const daysInMonth = new Date(year, month, 0).getDate();
          const day = Math.floor(Math.random() * daysInMonth) + 1;

          // Случайное время (9:00 - 18:00)
          const hour = 9 + Math.floor(Math.random() * 9);
          const minute = Math.random() < 0.5 ? 0 : 30;

          const lessonDate = new Date(year, month - 1, day, hour, minute, 0);

          // Статус: если урок в прошлом - APPROVED (завершенные были одобрены), 
          // если в будущем - случайно APPROVED (80%) или REJECTED (20%)
          let status;
          if (lessonDate < now) {
            status = 'APPROVED'; // Завершенные уроки были одобрены
          } else {
            // Будущие уроки: 80% одобрены, 20% отклонены
            status = Math.random() < 0.8 ? 'APPROVED' : 'REJECTED';
          }

          // Проверяем, нет ли уже урока в это время
          const existing = await pool.query(
            `SELECT id FROM lessons 
             WHERE tutor_id = $1 AND student_id = $2 AND date_time = $3`,
            [tutorId, studentId, lessonDate]
          );

          if (existing.rows.length === 0) {
            await pool.query(
              `INSERT INTO lessons (tutor_id, student_id, subject_id, date_time, duration, price, status)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [tutorId, studentId, subjectId, lessonDate, 60, hourlyRate, status]
            );
            lessonsCreatedForTutor++;
            totalLessonsCreated++;
          }
        }
      }

      console.log(`  ✓ Tutor ${tutor.email}: ${lessonsCreatedForTutor} lessons generated`);
    }

    // Генерируем отзывы, распределенные по месяцам для динамики рейтинга
    console.log('\n⭐ Generating reviews distributed across months...');
    
    // Получаем все завершенные уроки для создания отзывов (APPROVED и в прошлом)
    const completedLessonsResult = await pool.query(
      `SELECT l.id, l.tutor_id, l.student_id, l.date_time
       FROM lessons l
       WHERE l.status = 'APPROVED' AND l.date_time < NOW()
       ORDER BY l.date_time DESC`
    );

    const completedLessons = completedLessonsResult.rows;
    let reviewsCreated = 0;

    // Создаем отзывы для части завершенных уроков (примерно 30-40%)
    const lessonsToReview = Math.floor(completedLessons.length * 0.35);
    const shuffledLessons = [...completedLessons].sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(lessonsToReview, shuffledLessons.length); i++) {
      const lesson = shuffledLessons[i];
      
      // Проверяем, нет ли уже отзыва от этого студента этому репетитору
      const existingReview = await pool.query(
        `SELECT id FROM reviews 
         WHERE tutor_id = $1 AND student_id = $2`,
        [lesson.tutor_id, lesson.student_id]
      );

      if (existingReview.rows.length === 0) {
        // Рейтинг: чаще 4-5, реже 3
        const rating = Math.random() < 0.85 ? (Math.random() < 0.7 ? 5 : 4) : 3;
        
        // Комментарии в зависимости от рейтинга
        const comments = {
          5: [
            'Отличный репетитор! Объясняет материал понятно и доступно.',
            'Профессионал своего дела. Очень доволен занятиями.',
            'Прекрасный преподаватель! Занятия проходят интересно и продуктивно.',
            'Лучший репетитор! Помог достичь высоких результатов.',
            'Очень довольна занятиями. Рекомендую!'
          ],
          4: [
            'Хороший репетитор, но иногда бывают задержки.',
            'Хорошая подготовка. В целом результатом доволен.',
            'Хороший преподаватель, но хотелось бы больше практики.',
            'Хорошая подготовка к экзамену. Спасибо!'
          ],
          3: [
            'Неплохой репетитор, но есть что улучшить.',
            'В целом неплохо, но ожидал большего.'
          ]
        };

        const comment = comments[rating][Math.floor(Math.random() * comments[rating].length)];
        
        // Дата отзыва = дата урока + 1-7 дней (отзыв пишется после урока)
        const reviewDate = new Date(lesson.date_time);
        reviewDate.setDate(reviewDate.getDate() + Math.floor(Math.random() * 7) + 1);

        await pool.query(
          `INSERT INTO reviews (tutor_id, student_id, rating, comment, created_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING`,
          [lesson.tutor_id, lesson.student_id, rating, comment, reviewDate]
        );
        reviewsCreated++;
      }
    }

    console.log(`  ✓ Created ${reviewsCreated} reviews distributed across months`);

    // Обновляем рейтинги репетиторов на основе отзывов
    console.log('📊 Updating tutor ratings...');
    const tutorsForRating = await pool.query(
      `SELECT DISTINCT tutor_id FROM reviews`
    );

    for (const row of tutorsForRating.rows) {
      const tutorId = row.tutor_id;
      const avgRatingResult = await pool.query(
        `SELECT AVG(rating) as avg_rating
         FROM reviews WHERE tutor_id = $1`,
        [tutorId]
      );

      if (avgRatingResult.rows[0].avg_rating) {
        const avgRating = parseFloat(avgRatingResult.rows[0].avg_rating).toFixed(2);
        await pool.query(
          `UPDATE tutors SET rating = $1 WHERE id = $2`,
          [avgRating, tutorId]
        );
      }
    }
    console.log(`  ✓ Updated ratings for ${tutorsForRating.rows.length} tutors`);

    console.log(`\n✅ Analytics data generation completed!`);
    console.log(`   Total lessons created: ${totalLessonsCreated}`);
    console.log(`   Total reviews created: ${reviewsCreated}`);

    // Финальная статистика
    const finalStats = await pool.query(
      `SELECT 
        COUNT(DISTINCT tutor_id) as tutors,
        COUNT(DISTINCT student_id) as students,
        COUNT(*) FILTER (WHERE status = 'APPROVED' AND date_time < NOW()) as completed_lessons,
        COUNT(*) FILTER (WHERE status = 'APPROVED' AND date_time >= NOW()) as approved_lessons,
        COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected_lessons,
        SUM(price) FILTER (WHERE status = 'APPROVED' AND date_time < NOW()) as total_earnings
       FROM lessons`
    );

    const stats = finalStats.rows[0];
    console.log(`\n📊 Final statistics:`);
    console.log(`   Tutors with lessons: ${stats.tutors}`);
    console.log(`   Students with lessons: ${stats.students}`);
    console.log(`   Completed lessons: ${stats.completed_lessons}`);
    console.log(`   Approved future lessons: ${stats.approved_lessons}`);
    console.log(`   Rejected lessons: ${stats.rejected_lessons}`);
    console.log(`   Total earnings: ${parseFloat(stats.total_earnings || 0).toLocaleString('ru-RU')} ₽`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating analytics data:', error);
    process.exit(1);
  }
}

generateAnalyticsData();

