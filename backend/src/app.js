import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeMigrations } from './utils/migrations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import tutorRoutes from './routes/tutorRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import lessonRoutes from './routes/lessonRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
// Импортируйте другие роуты здесь
// import lessonRoutes from './routes/lessonRoutes.js';
// import reviewRoutes from './routes/reviewRoutes.js';
// import scheduleRoutes from './routes/scheduleRoutes.js';
// import analyticsRoutes from './routes/analyticsRoutes.js';
// import subjectRoutes from './routes/subjectRoutes.js';

// Загружаем .env из корня проекта
dotenv.config({ path: join(__dirname, '../.env') });
console.log('[App] .env file loaded from:', join(__dirname, '../.env'));
console.log('[App] JWT_SECRET from env:', process.env.JWT_SECRET ? 'YES (length: ' + process.env.JWT_SECRET.length + ')' : 'NO');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware для отладки (только для API запросов)
app.use((req, res, next) => {
  // Логируем только API запросы
  if (req.path.startsWith('/api') || req.path === '/health') {
    console.log(`${req.method} ${req.path}`);
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);
// app.use('/api/lessons', lessonRoutes);
// app.use('/api/reviews', reviewRoutes);
// app.use('/api/schedule', scheduleRoutes);
// app.use('/api/analytics', analyticsRoutes);
// app.use('/api/subjects', subjectRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test endpoint для проверки API
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler (только для API запросов)
app.use((req, res) => {
  // Игнорируем запросы на корневой путь и другие не-API пути
  if (!req.path.startsWith('/api') && req.path !== '/health') {
    return res.status(404).end();
  }
  console.log(`404: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Route not found', path: req.path, method: req.method });
});

// Инициализация миграций и запуск сервера
const startServer = async () => {
  try {
    // Запускаем миграции перед стартом сервера
    await initializeMigrations();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

