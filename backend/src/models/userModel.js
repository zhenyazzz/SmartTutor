export const UserRole = {
  STUDENT: 'STUDENT',
  TUTOR: 'TUTOR',
  ADMIN: 'ADMIN'
};

// Валидация для создания пользователя
export const validateCreateUser = (data) => {
  const errors = [];
  
  if (!data.fullName || data.fullName.trim().length === 0 || data.fullName.length > 100) {
    errors.push('fullName is required and must be max 100 characters');
  }
  
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || data.email.length > 100) {
    errors.push('email must be valid and max 100 characters');
  }
  
  if (!data.password || data.password.length < 6 || data.password.length > 255) {
    errors.push('password must be between 6 and 255 characters');
  }
  
  if (!data.role || !Object.values(UserRole).includes(data.role)) {
    errors.push('role must be one of: STUDENT, TUTOR, ADMIN');
  }
  
  return errors;
};

