import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt.js';
import { UserService } from '../services/userService.js';

const userService = new UserService();

// Middleware для проверки JWT токена
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('[Auth Middleware] No authorization header');
      return res.status(401).json({ error: 'Access token is required' });
    }

    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      console.log('[Auth Middleware] Token extraction failed');
      return res.status(401).json({ error: 'Access token is required' });
    }

    const decoded = verifyAccessToken(token);

    if (!decoded) {
      console.log('[Auth Middleware] Token verification failed');
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    console.log(`[Auth Middleware] Token decoded successfully. User ID: ${decoded.id}, Email: ${decoded.email}, Role: ${decoded.role}`);

    // Получаем пользователя из БД для проверки
    // Преобразуем ID в число, если это строка
    const userId = typeof decoded.id === 'string' ? parseInt(decoded.id, 10) : decoded.id;
    const user = await userService.getUserById(userId);
    
    if (!user) {
      console.log(`[Auth Middleware] User not found: ${userId} (decoded.id was: ${decoded.id}, type: ${typeof decoded.id})`);
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    console.log(`[Auth Middleware] User found: ${user.id}, isActive: ${user.isActive || 'N/A'}`);

    // Проверяем isActive отдельно, так как getUserById уже фильтрует по is_active
    // Но на всякий случай проверим еще раз
    if (user.isActive === false) {
      console.log(`[Auth Middleware] User inactive: ${userId}`);
      return res.status(401).json({ error: 'User account is inactive' });
    }

    // Добавляем информацию о пользователе в запрос
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('[Auth Middleware] Error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Middleware для проверки роли
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

