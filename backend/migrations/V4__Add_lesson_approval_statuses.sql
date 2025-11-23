-- Добавляем новые статусы для уроков: PENDING (ожидает одобрения) и APPROVED (одобрен)
-- Обновляем CHECK constraint для поддержки новых статусов
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_status_check;

ALTER TABLE lessons 
ADD CONSTRAINT lessons_status_check 
CHECK (status IN ('PENDING', 'PLANNED', 'APPROVED', 'COMPLETED', 'CANCELLED', 'REJECTED'));

-- Обновляем существующие уроки со статусом PLANNED на PENDING (если они еще не прошли)
UPDATE lessons 
SET status = 'PENDING' 
WHERE status = 'PLANNED' 
  AND date_time > CURRENT_TIMESTAMP;

-- Создаем индекс для быстрого поиска уроков по статусу
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);
CREATE INDEX IF NOT EXISTS idx_lessons_tutor_status ON lessons(tutor_id, status);

