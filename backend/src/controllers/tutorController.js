import { TutorService } from '../services/tutorService.js';

const tutorService = new TutorService();

export class TutorController {
  async getAllTutors(req, res) {
    try {
      const filters = {
        subject: req.query.subject,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
        minRating: req.query.minRating ? parseFloat(req.query.minRating) : undefined
      };

      const tutors = await tutorService.getAllTutors(filters);
      res.json(tutors);
    } catch (error) {
      console.error('Error getting tutors:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getTutorById(req, res) {
    try {
      const tutor = await tutorService.getTutorById(req.params.id);
      
      if (!tutor) {
        return res.status(404).json({ error: 'Tutor not found' });
      }

      res.json(tutor);
    } catch (error) {
      console.error('Error getting tutor:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getTutorByUserId(req, res) {
    try {
      const tutor = await tutorService.getTutorByUserId(req.params.userId);
      
      if (!tutor) {
        return res.status(404).json({ error: 'Tutor not found' });
      }

      res.json(tutor);
    } catch (error) {
      console.error('Error getting tutor by user id:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getStudentsByTutor(req, res) {
    try {
      const students = await tutorService.getStudentsByTutor(req.params.tutorId);
      res.json(students);
    } catch (error) {
      console.error('Error getting students by tutor:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getTutorStats(req, res) {
    try {
      const period = req.query.period || 'year';
      console.log(`[TutorController] getTutorStats called with tutorId: ${req.params.tutorId}, period: ${period}`);
      const stats = await tutorService.getTutorStats(req.params.tutorId, period);
      console.log(`[TutorController] Stats returned: lessons=${stats.lessonsThisMonth}, earnings=${stats.earningsThisMonth}`);
      res.json(stats);
    } catch (error) {
      console.error('Error getting tutor stats:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async updateTutor(req, res) {
    try {
      const tutorId = parseInt(req.params.id);
      if (isNaN(tutorId)) {
        return res.status(400).json({ error: 'Invalid tutor ID' });
      }

      const tutorData = {
        fullName: req.body.name,
        email: req.body.email,
        education: req.body.education,
        experienceYears: req.body.experience,
        bio: req.body.description,
        hourlyRate: req.body.hourlyRate,
        location: req.body.location,
        avatarUrl: req.body.avatar,
        phone: req.body.phone,
        subjects: req.body.subjects
      };

      const updatedTutor = await tutorService.updateTutor(tutorId, tutorData);
      
      if (!updatedTutor) {
        return res.status(404).json({ error: 'Tutor not found' });
      }
      
      res.json(updatedTutor);
    } catch (error) {
      console.error('Error updating tutor:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}

