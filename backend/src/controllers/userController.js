import { UserService } from '../services/userService.js';
import { validationResult } from 'express-validator';

const userService = new UserService();

export class UserController {
  async createUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await userService.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({ error: 'Email already exists' });
      }
      console.error('Error creating user:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getUserById(req, res) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const user = await userService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error getting user:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getAllUsers(req, res) {
    try {
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async updateUser(req, res) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      // Подготавливаем данные для обновления
      const updateData = {};
      if (req.body.fullName) updateData.fullName = req.body.fullName;
      if (req.body.email) updateData.email = req.body.email;
      if (req.body.password) updateData.password = req.body.password;
      if (req.body.role) updateData.role = req.body.role;
      if (req.body.phone !== undefined) updateData.phone = req.body.phone;

      // Проверяем, есть ли что обновлять
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const user = await userService.updateUser(id, updateData);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found or could not be updated' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error updating user:', error);
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({ error: 'Email already exists' });
      }
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async deleteUser(req, res) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const deleted = await userService.deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getAllUsersForAdmin(req, res) {
    try {
      const users = await userService.getAllUsersForAdmin();
      res.json(users);
    } catch (error) {
      console.error('Error getting users for admin:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getUserDetailsForAdmin(req, res) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const user = await userService.getUserDetailsForAdmin(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error getting user details for admin:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async toggleUserStatus(req, res) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const { isActive } = req.body;
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: 'isActive must be a boolean' });
      }

      const user = await userService.toggleUserStatus(id, isActive);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error toggling user status:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}

