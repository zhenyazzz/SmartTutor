-- Добавляем поле status для модерации отзывов
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'));

-- Обновляем существующие отзывы (где status IS NULL), чтобы они были одобрены по умолчанию
UPDATE reviews SET status = 'APPROVED' WHERE status IS NULL;

-- Создаем индекс для быстрого поиска по статусу
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

