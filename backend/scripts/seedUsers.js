import { pool } from '../src/config/database.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { initializeMigrations } from '../src/utils/migrations.js';

dotenv.config();

const password = 'password123';

// Предметы из StudentHomePage.tsx (строки 126-128)
const subjects = [
  'Математика',
  'Физика',
  'Химия',
  'Биология',
  'Английский язык',
  'История',
  'Программирование',
  'География',
  'Информатика',
  'Обществознание',
  'Экономика'
];

// Репетиторы из StudentHomePage.tsx (mockTutors)
const mockTutors = [
  {
    name: 'Анна Иванова',
    email: 'anna.ivanova@test.com',
    phone: '+7 (999) 123-45-67',
    subjects: ['Математика', 'Физика'],
    rating: 4.9,
    reviews: 127,
    hourlyRate: 1500,
    experience: 8,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    format: ['online', 'offline'],
    location: 'Москва',
    availability: ['Пн', 'Ср', 'Пт'],
    bio: 'Опытный репетитор по математике и физике с 8-летним стажем. Помогаю студентам достигать высоких результатов.',
    education: 'МГУ, факультет математики'
  },
  {
    name: 'Дмитрий Петров',
    email: 'dmitry.petrov@test.com',
    phone: '+7 (999) 234-56-78',
    subjects: ['Английский язык'],
    rating: 4.8,
    reviews: 93,
    hourlyRate: 2000,
    experience: 12,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    format: ['online'],
    location: null,
    availability: ['Вт', 'Чт', 'Сб'],
    bio: 'Преподаватель английского языка с международной сертификацией. Специализируюсь на подготовке к экзаменам.',
    education: 'МГЛУ, факультет лингвистики'
  },
  {
    name: 'Елена Смирнова',
    email: 'elena.smirnova@test.com',
    phone: '+7 (999) 345-67-89',
    subjects: ['Химия', 'Биология'],
    rating: 5.0,
    reviews: 156,
    hourlyRate: 1800,
    experience: 15,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    format: ['online', 'offline'],
    location: 'Санкт-Петербург',
    availability: ['Пн', 'Ср', 'Пт', 'Сб'],
    bio: 'Кандидат химических наук с 15-летним опытом преподавания. Помогаю в подготовке к ЕГЭ и олимпиадам.',
    education: 'СПбГУ, химический факультет'
  },
  {
    name: 'Михаил Козлов',
    email: 'mikhail.kozlov@test.com',
    phone: '+7 (999) 456-78-90',
    subjects: ['Программирование', 'Информатика'],
    rating: 4.7,
    reviews: 84,
    hourlyRate: 2500,
    experience: 10,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    format: ['online'],
    location: null,
    availability: ['Вт', 'Чт', 'Вс'],
    bio: 'Senior разработчик с опытом преподавания программирования. Обучаю Python, JavaScript, Java и другим языкам.',
    education: 'МФТИ, факультет прикладной математики'
  },
  {
    name: 'Ольга Новикова',
    email: 'olga.novikova@test.com',
    phone: '+7 (999) 567-89-01',
    subjects: ['История', 'Обществознание'],
    rating: 4.9,
    reviews: 112,
    hourlyRate: 1600,
    experience: 9,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    format: ['online', 'offline'],
    location: 'Москва',
    availability: ['Пн', 'Ср', 'Пт'],
    bio: 'Преподаватель истории и обществознания. Специализируюсь на подготовке к ЕГЭ и вступительным экзаменам.',
    education: 'МГУ, исторический факультет'
  },
  {
    name: 'Сергей Морозов',
    email: 'sergey.morozov@test.com',
    phone: '+7 (999) 678-90-12',
    subjects: ['География', 'Экономика'],
    rating: 4.6,
    reviews: 67,
    hourlyRate: 1400,
    experience: 6,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    format: ['offline'],
    location: 'Казань',
    availability: ['Вт', 'Чт', 'Сб'],
    bio: 'Экономист и географ с опытом преподавания. Помогаю в изучении экономики и географии.',
    education: 'КФУ, экономический факультет'
  }
];

// Базовые пользователи
const baseUsers = [
  {
    fullName: 'Иван Студентов',
    email: 'student@test.com',
    role: 'STUDENT'
  },
  {
    fullName: 'Анна Репетиторова',
    email: 'tutor@test.com',
    role: 'TUTOR'
  },
  {
    fullName: 'Админ Админов',
    email: 'admin@test.com',
    role: 'ADMIN'
  }
];

// Студенты для отзывов
const reviewStudents = [
  {
    fullName: 'Мария Петрова',
    email: 'maria.petrova@test.com',
    role: 'STUDENT'
  },
  {
    fullName: 'Александр Сидоров',
    email: 'alexander.sidorov@test.com',
    role: 'STUDENT'
  },
  {
    fullName: 'Екатерина Новикова',
    email: 'ekaterina.novikova@test.com',
    role: 'STUDENT'
  },
  {
    fullName: 'Дмитрий Волков',
    email: 'dmitry.volkov@test.com',
    role: 'STUDENT'
  },
  {
    fullName: 'София Лебедева',
    email: 'sofia.lebedeva@test.com',
    role: 'STUDENT'
  }
];

// Отзывы для репетиторов
const reviewsData = [
  // Для Анны Ивановой (Математика, Физика)
  { tutorEmail: 'anna.ivanova@test.com', studentEmail: 'maria.petrova@test.com', rating: 5, comment: 'Отличный репетитор! Объясняет материал понятно и доступно. За месяц занятий значительно улучшились мои знания по математике. Рекомендую!' },
  { tutorEmail: 'anna.ivanova@test.com', studentEmail: 'alexander.sidorov@test.com', rating: 5, comment: 'Профессионал своего дела. Помогла подготовиться к ЕГЭ, результат превзошел ожидания! Очень доволен занятиями.' },
  { tutorEmail: 'anna.ivanova@test.com', studentEmail: 'ekaterina.novikova@test.com', rating: 4, comment: 'Хороший репетитор, но иногда бывают задержки с началом занятий. В целом результатом довольна.' },
  
  // Для Дмитрия Петрова (Английский язык)
  { tutorEmail: 'dmitry.petrov@test.com', studentEmail: 'maria.petrova@test.com', rating: 5, comment: 'Прекрасный преподаватель английского! Занятия проходят интересно и продуктивно. Уровень языка заметно вырос.' },
  { tutorEmail: 'dmitry.petrov@test.com', studentEmail: 'dmitry.volkov@test.com', rating: 5, comment: 'Отличная подготовка к IELTS. Сдал экзамен на нужный балл с первого раза. Спасибо!' },
  { tutorEmail: 'dmitry.petrov@test.com', studentEmail: 'sofia.lebedeva@test.com', rating: 4, comment: 'Хороший преподаватель, но хотелось бы больше разговорной практики. В остальном все отлично.' },
  
  // Для Елены Смирновой (Химия, Биология)
  { tutorEmail: 'elena.smirnova@test.com', studentEmail: 'alexander.sidorov@test.com', rating: 5, comment: 'Лучший репетитор по химии! Объясняет сложные темы простым языком. Помогла сдать ЕГЭ на высокий балл.' },
  { tutorEmail: 'elena.smirnova@test.com', studentEmail: 'ekaterina.novikova@test.com', rating: 5, comment: 'Очень довольна занятиями. Преподаватель с большим опытом, знает все тонкости экзамена. Рекомендую!' },
  { tutorEmail: 'elena.smirnova@test.com', studentEmail: 'maria.petrova@test.com', rating: 5, comment: 'Помогла подготовиться к олимпиаде по биологии. Занял призовое место! Спасибо за профессионализм.' },
  
  // Для Михаила Козлова (Программирование, Информатика)
  { tutorEmail: 'mikhail.kozlov@test.com', studentEmail: 'dmitry.volkov@test.com', rating: 5, comment: 'Отличный преподаватель программирования! Научил Python с нуля. Теперь могу писать собственные проекты.' },
  { tutorEmail: 'mikhail.kozlov@test.com', studentEmail: 'alexander.sidorov@test.com', rating: 4, comment: 'Хороший репетитор, но иногда объяснения слишком сложные для новичков. В целом помог разобраться с JavaScript.' },
  { tutorEmail: 'mikhail.kozlov@test.com', studentEmail: 'sofia.lebedeva@test.com', rating: 5, comment: 'Помог подготовиться к экзамену по информатике. Объясняет структуры данных очень понятно. Рекомендую!' },
  
  // Для Ольги Новиковой (История, Обществознание)
  { tutorEmail: 'olga.novikova@test.com', studentEmail: 'ekaterina.novikova@test.com', rating: 5, comment: 'Прекрасный преподаватель истории! Занятия проходят интересно, много исторических фактов и дат запомнилось.' },
  { tutorEmail: 'olga.novikova@test.com', studentEmail: 'maria.petrova@test.com', rating: 4, comment: 'Хорошая подготовка к ЕГЭ по обществознанию. Материал структурирован и понятен. Спасибо!' },
  { tutorEmail: 'olga.novikova@test.com', studentEmail: 'dmitry.volkov@test.com', rating: 5, comment: 'Отличный репетитор! Помогла систематизировать знания по истории. Сдал экзамен на высокий балл.' },
  
  // Для Сергея Морозова (География, Экономика)
  { tutorEmail: 'sergey.morozov@test.com', studentEmail: 'sofia.lebedeva@test.com', rating: 4, comment: 'Хороший преподаватель географии. Объясняет материал доступно, но иногда не хватает визуальных материалов.' },
  { tutorEmail: 'sergey.morozov@test.com', studentEmail: 'alexander.sidorov@test.com', rating: 5, comment: 'Отличная подготовка по экономике! Разобрали все сложные темы, сдал экзамен успешно. Спасибо!' },
  { tutorEmail: 'sergey.morozov@test.com', studentEmail: 'ekaterina.novikova@test.com', rating: 4, comment: 'Хороший репетитор, помог разобраться с экономической географией. В целом довольна результатом.' }
];

// Маппинг дней недели для расписания
const dayMapping = {
  'Пн': 'MONDAY',
  'Вт': 'TUESDAY',
  'Ср': 'WEDNESDAY',
  'Чт': 'THURSDAY',
  'Пт': 'FRIDAY',
  'Сб': 'SATURDAY',
  'Вс': 'SUNDAY'
};

async function seedDatabase() {
  try {
    console.log('🚀 Starting database seeding...\n');

    // 0. Сначала запускаем миграции
    console.log('📦 Running database migrations...');
    await initializeMigrations();
    console.log('✓ Migrations completed\n');

    // 1. Генерируем хеш пароля
    console.log('📝 Generating password hash for "password123"...');
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('✓ Password hash generated');
    
    const testCompare = await bcrypt.compare(password, passwordHash);
    if (!testCompare) {
      throw new Error('Password hash generation failed!');
    }
    console.log('✓ Password hash verified\n');

    // 2. Создаем базовых пользователей
    console.log('👥 Creating base users...');
    for (const user of baseUsers) {
      const existing = await pool.query(
        `SELECT email FROM users WHERE email = $1`,
        [user.email]
      );
      
      if (existing.rows.length > 0) {
        await pool.query(
          `UPDATE users SET full_name = $1, password_hash = $2, role = $3, is_active = $4
           WHERE email = $5`,
          [user.fullName, passwordHash, user.role, true, user.email]
        );
        console.log(`  ✓ Updated user: ${user.email}`);
      } else {
        await pool.query(
          `INSERT INTO users (full_name, email, password_hash, role, is_active, created_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
          [user.fullName, user.email, passwordHash, user.role, true]
        );
        console.log(`  ✓ Created user: ${user.email}`);
      }
    }
    console.log('✓ Base users created\n');

    // 3. Создаем предметы
    console.log('📚 Creating subjects...');
    const subjectMap = {};
    for (const subjectName of subjects) {
      const result = await pool.query(
        `INSERT INTO subjects (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [subjectName]
      );
      subjectMap[subjectName] = result.rows[0].id;
      console.log(`  ✓ Subject: ${subjectName}`);
    }
    console.log('✓ All subjects created\n');

    // 4. Создаем репетиторов
    console.log('🎓 Creating tutors...');
    for (const tutorData of mockTutors) {
      // Создаем или обновляем пользователя-репетитора
      let userId;
      const userResult = await pool.query(
        `SELECT id FROM users WHERE email = $1`,
        [tutorData.email]
      );

      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].id;
        await pool.query(
          `UPDATE users SET full_name = $1, password_hash = $2, role = $3, is_active = $4
           WHERE id = $5`,
          [tutorData.name, passwordHash, 'TUTOR', true, userId]
        );
      } else {
        const newUserResult = await pool.query(
          `INSERT INTO users (full_name, email, password_hash, role, is_active, created_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
           RETURNING id`,
          [tutorData.name, tutorData.email, passwordHash, 'TUTOR', true]
        );
        userId = newUserResult.rows[0].id;
      }

      // Создаем или обновляем запись репетитора
      const tutorResult = await pool.query(
        `INSERT INTO tutors (user_id, education, experience_years, bio, rating, hourly_rate, location, avatar_url, phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (user_id) DO UPDATE SET
           education = EXCLUDED.education,
           experience_years = EXCLUDED.experience_years,
           bio = EXCLUDED.bio,
           rating = EXCLUDED.rating,
           hourly_rate = EXCLUDED.hourly_rate,
           location = EXCLUDED.location,
           avatar_url = EXCLUDED.avatar_url,
           phone = EXCLUDED.phone
         RETURNING id`,
        [
          userId,
          tutorData.education,
          tutorData.experience,
          tutorData.bio,
          tutorData.rating,
          tutorData.hourlyRate,
          tutorData.location,
          tutorData.avatar,
          tutorData.phone
        ]
      );

      const tutorId = tutorResult.rows[0].id;

      // Удаляем старые связи с предметами
      await pool.query(
        `DELETE FROM tutor_subjects WHERE tutor_id = $1`,
        [tutorId]
      );

      // Создаем связи с предметами
      for (const subjectName of tutorData.subjects) {
        const subjectId = subjectMap[subjectName];
        if (subjectId) {
          await pool.query(
            `INSERT INTO tutor_subjects (tutor_id, subject_id)
             VALUES ($1, $2)
             ON CONFLICT (tutor_id, subject_id) DO NOTHING`,
            [tutorId, subjectId]
          );
        }
      }

      // Создаем расписание по умолчанию (Пн-Пт, 9:00-18:00, по 60 минут)
      await pool.query(
        `DELETE FROM schedule_slots WHERE tutor_id = $1`,
        [tutorId]
      );

      const defaultDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
      let slotsCount = 0;
      for (const day of defaultDays) {
        for (let hour = 9; hour < 18; hour++) {
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
          slotsCount++;
        }
      }

      console.log(`  ✓ Tutor: ${tutorData.name} (${tutorData.subjects.join(', ')}) - ${slotsCount} slots created`);
    }
    console.log('✓ All tutors created\n');

    // 5. Создаем студентов для отзывов
    console.log('👨‍🎓 Creating review students...');
    const studentMap = {};
    for (const student of reviewStudents) {
      const existing = await pool.query(
        `SELECT id FROM users WHERE email = $1`,
        [student.email]
      );

      let studentId;
      if (existing.rows.length > 0) {
        studentId = existing.rows[0].id;
        await pool.query(
          `UPDATE users SET full_name = $1, password_hash = $2, role = $3, is_active = $4
           WHERE id = $5`,
          [student.fullName, passwordHash, student.role, true, studentId]
        );
      } else {
        const result = await pool.query(
          `INSERT INTO users (full_name, email, password_hash, role, is_active, created_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
           RETURNING id`,
          [student.fullName, student.email, passwordHash, student.role, true]
        );
        studentId = result.rows[0].id;
      }
      studentMap[student.email] = studentId;
      console.log(`  ✓ Student: ${student.fullName}`);
    }
    console.log('✓ Review students created\n');

    // 6. Создаем отзывы
    console.log('💬 Creating reviews...');
    const tutorEmailToIdMap = {};
    for (const tutorData of mockTutors) {
      const tutorResult = await pool.query(
        `SELECT t.id FROM tutors t
         INNER JOIN users u ON t.user_id = u.id
         WHERE u.email = $1`,
        [tutorData.email]
      );
      if (tutorResult.rows.length > 0) {
        tutorEmailToIdMap[tutorData.email] = tutorResult.rows[0].id;
      }
    }

    let createdReviewsCount = 0;
    for (const review of reviewsData) {
      const tutorId = tutorEmailToIdMap[review.tutorEmail];
      const studentId = studentMap[review.studentEmail];

      if (tutorId && studentId) {
        // Проверяем, нет ли уже такого отзыва
        const existing = await pool.query(
          `SELECT id FROM reviews WHERE tutor_id = $1 AND student_id = $2`,
          [tutorId, studentId]
        );

        if (existing.rows.length === 0) {
          const daysAgo = Math.floor(Math.random() * 30);
          await pool.query(
            `INSERT INTO reviews (tutor_id, student_id, rating, comment, created_at)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP - INTERVAL '${daysAgo} days')`,
            [tutorId, studentId, review.rating, review.comment]
          );
          createdReviewsCount++;
        }
      }
    }
    console.log(`  ✓ Created ${createdReviewsCount} reviews`);

    // Обновляем рейтинги репетиторов на основе отзывов
    for (const tutorEmail in tutorEmailToIdMap) {
      const tutorId = tutorEmailToIdMap[tutorEmail];
      const avgRatingResult = await pool.query(
        `SELECT AVG(rating) as avg_rating, COUNT(*) as count
         FROM reviews WHERE tutor_id = $1`,
        [tutorId]
      );

      if (avgRatingResult.rows[0].count > 0) {
        const avgRating = parseFloat(avgRatingResult.rows[0].avg_rating).toFixed(2);
        await pool.query(
          `UPDATE tutors SET rating = $1 WHERE id = $2`,
          [avgRating, tutorId]
        );
      }
    }

    console.log('✓ Reviews created\n');

    // 7. Создаем уроки между студентами и репетиторами
    console.log('📅 Creating lessons...');
    
    // Данные для уроков: связь студента с репетитором, предмет, количество уроков
    const lessonsData = [
      // Анна Иванова - Математика, Физика
      { tutorEmail: 'anna.ivanova@test.com', studentEmail: 'maria.petrova@test.com', subject: 'Математика', count: 24, completed: 20 },
      { tutorEmail: 'anna.ivanova@test.com', studentEmail: 'alexander.sidorov@test.com', subject: 'Физика', count: 16, completed: 12 },
      { tutorEmail: 'anna.ivanova@test.com', studentEmail: 'ekaterina.novikova@test.com', subject: 'Математика', count: 8, completed: 5 },
      
      // Дмитрий Петров - Английский язык
      { tutorEmail: 'dmitry.petrov@test.com', studentEmail: 'maria.petrova@test.com', subject: 'Английский язык', count: 18, completed: 15 },
      { tutorEmail: 'dmitry.petrov@test.com', studentEmail: 'dmitry.volkov@test.com', subject: 'Английский язык', count: 12, completed: 10 },
      { tutorEmail: 'dmitry.petrov@test.com', studentEmail: 'sofia.lebedeva@test.com', subject: 'Английский язык', count: 10, completed: 7 },
      
      // Елена Смирнова - Химия, Биология
      { tutorEmail: 'elena.smirnova@test.com', studentEmail: 'alexander.sidorov@test.com', subject: 'Химия', count: 20, completed: 18 },
      { tutorEmail: 'elena.smirnova@test.com', studentEmail: 'ekaterina.novikova@test.com', subject: 'Биология', count: 15, completed: 12 },
      { tutorEmail: 'elena.smirnova@test.com', studentEmail: 'maria.petrova@test.com', subject: 'Биология', count: 10, completed: 8 },
      
      // Михаил Козлов - Программирование, Информатика
      { tutorEmail: 'mikhail.kozlov@test.com', studentEmail: 'dmitry.volkov@test.com', subject: 'Программирование', count: 16, completed: 14 },
      { tutorEmail: 'mikhail.kozlov@test.com', studentEmail: 'alexander.sidorov@test.com', subject: 'Информатика', count: 12, completed: 9 },
      { tutorEmail: 'mikhail.kozlov@test.com', studentEmail: 'sofia.lebedeva@test.com', subject: 'Информатика', count: 10, completed: 8 },
      
      // Ольга Новикова - История, Обществознание
      { tutorEmail: 'olga.novikova@test.com', studentEmail: 'ekaterina.novikova@test.com', subject: 'История', count: 14, completed: 11 },
      { tutorEmail: 'olga.novikova@test.com', studentEmail: 'maria.petrova@test.com', subject: 'Обществознание', count: 12, completed: 9 },
      { tutorEmail: 'olga.novikova@test.com', studentEmail: 'dmitry.volkov@test.com', subject: 'История', count: 10, completed: 8 },
      
      // Сергей Морозов - География, Экономика
      { tutorEmail: 'sergey.morozov@test.com', studentEmail: 'sofia.lebedeva@test.com', subject: 'География', count: 8, completed: 5 },
      { tutorEmail: 'sergey.morozov@test.com', studentEmail: 'alexander.sidorov@test.com', subject: 'Экономика', count: 12, completed: 10 },
      { tutorEmail: 'sergey.morozov@test.com', studentEmail: 'ekaterina.novikova@test.com', subject: 'География', count: 6, completed: 4 }
    ];

    let createdLessonsCount = 0;
    for (const lessonData of lessonsData) {
      const tutorId = tutorEmailToIdMap[lessonData.tutorEmail];
      const studentId = studentMap[lessonData.studentEmail];
      const subjectId = subjectMap[lessonData.subject];

      if (!tutorId || !studentId || !subjectId) {
        console.log(`  ⚠ Skipping lesson: tutor or student not found`);
        continue;
      }

      // Получаем hourly_rate репетитора
      const tutorRateResult = await pool.query(
        `SELECT hourly_rate FROM tutors WHERE id = $1`,
        [tutorId]
      );
      const hourlyRate = parseFloat(tutorRateResult.rows[0]?.hourly_rate) || 1500;
      const lessonPrice = hourlyRate; // 1 час = hourly_rate

      // Создаем завершенные уроки (в прошлом)
      for (let i = 0; i < lessonData.completed; i++) {
        // Уроки распределяем по времени: от 3 месяцев назад до 1 недели назад
        const daysAgo = 90 - Math.floor((i / lessonData.completed) * 83);
        const lessonDate = new Date();
        lessonDate.setDate(lessonDate.getDate() - daysAgo);
        
        // Устанавливаем случайное время в рабочее время (9:00 - 18:00)
        const hour = 9 + Math.floor(Math.random() * 9);
        const minute = Math.random() < 0.5 ? 0 : 30;
        lessonDate.setHours(hour, minute, 0, 0);

        await pool.query(
          `INSERT INTO lessons (tutor_id, student_id, subject_id, date_time, duration, price, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'COMPLETED')
           ON CONFLICT DO NOTHING`,
          [tutorId, studentId, subjectId, lessonDate, 60, lessonPrice]
        );
        createdLessonsCount++;
      }

      // Создаем запланированные уроки (в будущем)
      const plannedCount = lessonData.count - lessonData.completed;
      for (let i = 0; i < plannedCount; i++) {
        // Уроки распределяем по времени: от завтра до 2 месяцев вперед
        const daysAhead = 1 + Math.floor((i / plannedCount) * 60);
        const lessonDate = new Date();
        lessonDate.setDate(lessonDate.getDate() + daysAhead);
        
        // Устанавливаем случайное время в рабочее время (9:00 - 18:00)
        const hour = 9 + Math.floor(Math.random() * 9);
        const minute = Math.random() < 0.5 ? 0 : 30;
        lessonDate.setHours(hour, minute, 0, 0);

        await pool.query(
          `INSERT INTO lessons (tutor_id, student_id, subject_id, date_time, duration, price, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'PLANNED')
           ON CONFLICT DO NOTHING`,
          [tutorId, studentId, subjectId, lessonDate, 60, lessonPrice]
        );
        createdLessonsCount++;
      }
    }
    console.log(`  ✓ Created ${createdLessonsCount} lessons`);

    // 8. Финальная проверка
    console.log('🔍 Verifying data...');
    const testUser = await pool.query(
      `SELECT email, password_hash FROM users WHERE email = $1`,
      ['student@test.com']
    );
    
    if (testUser.rows.length > 0) {
      const isValid = await bcrypt.compare(password, testUser.rows[0].password_hash);
      console.log(`✓ Password verification: ${isValid ? 'PASSED' : 'FAILED'}`);
    }

    const tutorsCount = await pool.query(`SELECT COUNT(*) FROM tutors`);
    const subjectsCount = await pool.query(`SELECT COUNT(*) FROM subjects`);
    const usersCount = await pool.query(`SELECT COUNT(*) FROM users WHERE is_active = true`);
    const scheduleSlotsCount = await pool.query(`SELECT COUNT(*) FROM schedule_slots`);
    const reviewsCount = await pool.query(`SELECT COUNT(*) FROM reviews`);
    const lessonsCount = await pool.query(`SELECT COUNT(*) FROM lessons`);

    console.log(`\n📊 Database summary:`);
    console.log(`   Users: ${usersCount.rows[0].count}`);
    console.log(`   Tutors: ${tutorsCount.rows[0].count}`);
    console.log(`   Subjects: ${subjectsCount.rows[0].count}`);
    console.log(`   Schedule slots: ${scheduleSlotsCount.rows[0].count}`);
    console.log(`   Reviews: ${reviewsCount.rows[0].count}`);
    console.log(`   Lessons: ${lessonsCount.rows[0].count}`);

    console.log('\n✅ Database seeding completed successfully!');
    console.log(`\n📝 Login credentials:`);
    console.log(`   Email: student@test.com | tutor@test.com | admin@test.com`);
    console.log(`   Password: ${password}`);
    console.log(`\n🎓 Tutor accounts:`);
    mockTutors.forEach(t => {
      console.log(`   ${t.email} (${t.name})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
