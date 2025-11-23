import { ScheduleService } from '../services/scheduleService.js';

const scheduleService = new ScheduleService();

export class ScheduleController {
  async getScheduleTemplate(req, res) {
    try {
      const schedule = await scheduleService.getScheduleTemplate(req.params.tutorId);
      res.json(schedule);
    } catch (error) {
      console.error('Error getting schedule template:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getAvailableSlots(req, res) {
    try {
      const daysAhead = parseInt(req.query.daysAhead) || 14;
      const slots = await scheduleService.getAvailableSlots(req.params.tutorId, daysAhead);
      res.json(slots);
    } catch (error) {
      console.error('Error getting available slots:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async createDefaultSchedule(req, res) {
    try {
      await scheduleService.createDefaultSchedule(req.params.tutorId);
      res.json({ message: 'Default schedule created successfully' });
    } catch (error) {
      console.error('Error creating default schedule:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async updateSchedule(req, res) {
    try {
      await scheduleService.updateSchedule(req.params.tutorId, req.body.slots);
      res.json({ message: 'Schedule updated successfully' });
    } catch (error) {
      console.error('Error updating schedule:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}

