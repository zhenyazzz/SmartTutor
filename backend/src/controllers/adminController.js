import { AdminService } from '../services/adminService.js';

const adminService = new AdminService();

export class AdminController {
  async getPlatformStats(req, res) {
    try {
      const period = req.query.period || 'year';
      const stats = await adminService.getPlatformStats(period);
      res.json(stats);
    } catch (error) {
      console.error('Error getting platform stats:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getPlatformGrowth(req, res) {
    try {
      const period = req.query.period || 'year';
      const growth = await adminService.getPlatformGrowth(period);
      res.json(growth);
    } catch (error) {
      console.error('Error getting platform growth:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getRevenueData(req, res) {
    try {
      const period = req.query.period || 'year';
      const revenue = await adminService.getRevenueData(period);
      res.json(revenue);
    } catch (error) {
      console.error('Error getting revenue data:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getRevenueStats(req, res) {
    try {
      const period = req.query.period || 'year';
      const stats = await adminService.getRevenueStats(period);
      res.json(stats);
    } catch (error) {
      console.error('Error getting revenue stats:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getSubjectPopularity(req, res) {
    try {
      const popularity = await adminService.getSubjectPopularity();
      res.json(popularity);
    } catch (error) {
      console.error('Error getting subject popularity:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getCityDistribution(req, res) {
    try {
      const distribution = await adminService.getCityDistribution();
      res.json(distribution);
    } catch (error) {
      console.error('Error getting city distribution:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getTopTutors(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const tutors = await adminService.getTopTutors(limit);
      res.json(tutors);
    } catch (error) {
      console.error('Error getting top tutors:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}

