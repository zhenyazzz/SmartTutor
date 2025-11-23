import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Загружаем .env из корня проекта (на уровень выше от src/utils)
dotenv.config({ path: join(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '-refresh';
// Увеличиваем время жизни токенов для разработки
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '24h'; // 24 часа вместо 15 минут
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '30d'; // 30 дней вместо 7

// Логирование для отладки (только в разработке)
console.log('[JWT Config] JWT_SECRET loaded:', JWT_SECRET ? 'YES (length: ' + JWT_SECRET.length + ')' : 'NO');
console.log('[JWT Config] JWT_SECRET from env:', process.env.JWT_SECRET ? 'YES' : 'NO (using default)');
console.log('[JWT Config] ACCESS_TOKEN_EXPIRY:', ACCESS_TOKEN_EXPIRY);
console.log('[JWT Config] REFRESH_TOKEN_EXPIRY:', REFRESH_TOKEN_EXPIRY);

// Генерация access токена
export const generateAccessToken = (payload) => {
  try {
    if (!JWT_SECRET || JWT_SECRET === 'your-secret-key-here-change-in-production') {
      console.warn('[JWT] WARNING: Using default JWT_SECRET! This is insecure.');
    }
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });
  } catch (error) {
    console.error('[JWT] Error generating access token:', error);
    throw error;
  }
};

// Генерация refresh токена
export const generateRefreshToken = (payload) => {
  try {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });
  } catch (error) {
    console.error('[JWT] Error generating refresh token:', error);
    throw error;
  }
};

// Верификация access токена
export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[JWT] Token verification failed:', error.message);
    }
    return null;
  }
};

// Верификация refresh токена
export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    return decoded;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[JWT] Refresh token verification failed:', error.message);
    }
    return null;
  }
};

// Извлечение токена из заголовка Authorization
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

