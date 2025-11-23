import { pool } from '../config/database.js';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { UserService } from './userService.js';

const userService = new UserService();

export class AuthService {
  // Регистрация пользователя
  async register(data) {
    const { fullName, email, password, role } = data;

    // Проверяем, существует ли пользователь
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Создаем пользователя
    const user = await userService.createUser({
      fullName,
      email,
      password,
      role: role || 'STUDENT'
    });

    // Генерируем токены
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email
    });

    // Сохраняем refresh токен в БД
    await this.saveRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      accessToken,
      refreshToken
    };
  }

  // Авторизация пользователя
  async login(email, password) {
    console.log(`[AuthService] Login attempt for email: ${email}`);
    
    // Находим пользователя
    const user = await userService.getUserByEmail(email);
    if (!user) {
      console.log(`[AuthService] User not found: ${email}`);
      throw new Error('Invalid email or password');
    }

    console.log(`[AuthService] User found: ${user.email}, isActive: ${user.isActive}`);

    // Проверяем активность пользователя
    if (!user.isActive) {
      console.log(`[AuthService] User account is deactivated: ${email}`);
      throw new Error('User account is deactivated');
    }

    // Проверяем пароль
    console.log(`[AuthService] Comparing password...`);
    console.log(`[AuthService] Input password: "${password}"`);
    console.log(`[AuthService] Stored hash: ${user.passwordHash ? user.passwordHash.substring(0, 20) + '...' : 'NULL'}`);
    console.log(`[AuthService] Hash length: ${user.passwordHash ? user.passwordHash.length : 0}`);
    
    if (!user.passwordHash) {
      console.log(`[AuthService] ERROR: passwordHash is NULL for user ${email}`);
      throw new Error('Invalid email or password');
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    console.log(`[AuthService] Password valid: ${isPasswordValid}`);
    
    // Дополнительная проверка - попробуем сравнить напрямую
    if (!isPasswordValid) {
      console.log(`[AuthService] Invalid password for: ${email}`);
      console.log(`[AuthService] Attempting to verify hash format...`);
      // Проверяем формат хеша
      if (!user.passwordHash.startsWith('$2a$') && !user.passwordHash.startsWith('$2b$')) {
        console.log(`[AuthService] ERROR: Invalid hash format! Hash doesn't start with $2a$ or $2b$`);
      }
      throw new Error('Invalid email or password');
    }

    // Генерируем токены
    let accessToken, refreshToken;
    try {
      console.log(`[AuthService] Generating tokens for user ${user.id} (type: ${typeof user.id})...`);
      // Убеждаемся, что ID - это число
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      console.log(`[AuthService] Using userId: ${userId} (type: ${typeof userId})`);
      
      accessToken = generateAccessToken({
        id: userId,
        email: user.email,
        role: user.role
      });
      console.log(`[AuthService] Access token generated successfully`);

      refreshToken = generateRefreshToken({
        id: userId,
        email: user.email
      });
      console.log(`[AuthService] Refresh token generated successfully`);
    } catch (tokenError) {
      console.error(`[AuthService] Error generating tokens:`, tokenError);
      throw new Error('Failed to generate authentication tokens: ' + tokenError.message);
    }

    // Сохраняем refresh токен в БД
    try {
      console.log(`[AuthService] Saving refresh token to database...`);
      await this.saveRefreshToken(user.id, refreshToken);
      console.log(`[AuthService] Refresh token saved successfully`);
    } catch (saveError) {
      console.error(`[AuthService] Error saving refresh token:`, saveError);
      // Не прерываем процесс, если не удалось сохранить refresh token
      // Пользователь все равно получит токены
    }

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      accessToken,
      refreshToken
    };
  }

  // Сохранение refresh токена в БД
  async saveRefreshToken(userId, token) {
    // Вычисляем время истечения (7 дней)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (token) DO UPDATE SET expires_at = $3, is_revoked = FALSE`,
      [userId, token, expiresAt]
    );
  }

  // Обновление токенов
  async refreshTokens(refreshToken) {
    const { verifyRefreshToken } = await import('../utils/jwt.js');
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      throw new Error('Invalid refresh token');
    }

    // Проверяем, что токен есть в БД и не отозван
    const tokenRecord = await pool.query(
      `SELECT user_id, is_revoked, expires_at 
       FROM refresh_tokens 
       WHERE token = $1`,
      [refreshToken]
    );

    if (tokenRecord.rows.length === 0) {
      throw new Error('Refresh token not found');
    }

    const tokenData = tokenRecord.rows[0];

    if (tokenData.is_revoked) {
      throw new Error('Refresh token has been revoked');
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      throw new Error('Refresh token has expired');
    }

    // Получаем пользователя
    const user = await userService.getUserById(tokenData.user_id);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Генерируем новые токены
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    const newRefreshToken = generateRefreshToken({
      id: user.id,
      email: user.email
    });

    // Отзываем старый токен и сохраняем новый
    await pool.query(
      `UPDATE refresh_tokens SET is_revoked = TRUE WHERE token = $1`,
      [refreshToken]
    );

    await this.saveRefreshToken(user.id, newRefreshToken);

    return {
      accessToken,
      refreshToken: newRefreshToken
    };
  }

  // Выход (отзыв токена)
  async logout(refreshToken) {
    await pool.query(
      `UPDATE refresh_tokens SET is_revoked = TRUE WHERE token = $1`,
      [refreshToken]
    );
  }

  // Отзыв всех токенов пользователя
  async logoutAll(userId) {
    await pool.query(
      `UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1`,
      [userId]
    );
  }

  // Проверка валидности refresh токена
  async validateRefreshToken(token) {
    const tokenRecord = await pool.query(
      `SELECT user_id, is_revoked, expires_at 
       FROM refresh_tokens 
       WHERE token = $1`,
      [token]
    );

    if (tokenRecord.rows.length === 0) {
      return false;
    }

    const tokenData = tokenRecord.rows[0];

    if (tokenData.is_revoked) {
      return false;
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return false;
    }

    return true;
  }
}

