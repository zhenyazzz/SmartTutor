import { AuthService } from '../services/authService.js';
import { validationResult } from 'express-validator';

const authService = new AuthService();

export class AuthController {
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      if (error.message === 'User with this email already exists') {
        return res.status(409).json({ error: error.message });
      }
      console.error('Error registering user:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      console.log(`[AuthController] Login request for: ${email}`);
      const result = await authService.login(email, password);
      console.log(`[AuthController] Login successful for: ${email}`);
      res.json(result);
    } catch (error) {
      console.error(`[AuthController] Login error for ${req.body?.email || 'unknown'}:`, error);
      console.error(`[AuthController] Error stack:`, error.stack);
      
      if (error.message === 'Invalid email or password' || 
          error.message === 'User account is deactivated') {
        return res.status(401).json({ error: error.message });
      }
      
      // Более детальная ошибка для отладки
      const errorMessage = error.message || 'Internal server error';
      console.error('[AuthController] Full error details:', {
        message: errorMessage,
        stack: error.stack,
        name: error.name
      });
      
      res.status(500).json({ 
        error: errorMessage,
        details: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      });
    }
  }

  async refresh(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      const result = await authService.refreshTokens(refreshToken);
      res.json(result);
    } catch (error) {
      if (error.message.includes('Invalid') || 
          error.message.includes('not found') ||
          error.message.includes('revoked') ||
          error.message.includes('expired')) {
        return res.status(401).json({ error: error.message });
      }
      console.error('Error refreshing tokens:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async logout(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      await authService.logout(refreshToken);
      res.status(204).send();
    } catch (error) {
      console.error('Error logging out:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async logoutAll(req, res) {
    try {
      const userId = req.user.id; // Из middleware
      await authService.logoutAll(userId);
      res.status(204).send();
    } catch (error) {
      console.error('Error logging out all:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}

