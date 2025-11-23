import { pool } from '../config/database.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Таблица для отслеживания выполненных миграций
const createMigrationsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

// Проверка, применена ли миграция
const isMigrationApplied = async (version) => {
  const result = await pool.query(
    'SELECT version FROM schema_migrations WHERE version = $1',
    [version]
  );
  return result.rows.length > 0;
};

// Отметка миграции как выполненной
const markMigrationApplied = async (version) => {
  await pool.query(
    'INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING',
    [version]
  );
};

// Проверка существования таблиц
const checkTablesExist = async () => {
  const result = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  `);
  return result.rows.length > 0;
};

// Проверка существования колонки
const checkColumnExists = async (table, column) => {
  const result = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = $1 
    AND column_name = $2
  `, [table, column]);
  return result.rows.length > 0;
};

// Проверка constraint для статусов уроков
const checkLessonsStatusConstraint = async () => {
  const result = await pool.query(`
    SELECT constraint_name, check_clause
    FROM information_schema.check_constraints
    WHERE constraint_name = 'lessons_status_check'
    AND check_clause LIKE '%PENDING%'
  `);
  return result.rows.length > 0;
};

// Запуск миграции из SQL файла
const runMigration = async (version, sqlFile) => {
  try {
    const filePath = join(__dirname, '../../migrations', sqlFile);
    const sql = readFileSync(filePath, 'utf8');
    
    // Выполняем SQL в транзакции
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await markMigrationApplied(version);
      await client.query('COMMIT');
      console.log(`✓ Migration ${version} applied successfully`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`✗ Error applying migration ${version}:`, error.message);
    throw error;
  }
};

// Инициализация миграций
export const initializeMigrations = async () => {
  try {
    console.log('Checking database migrations...');
    
    // Создаем таблицу для отслеживания миграций
    await createMigrationsTable();
    
    // Список миграций в порядке применения
    const migrations = [
      { version: 'V1__Initial_schema', file: 'V1__Initial_schema.sql', checkTable: 'users' },
      { version: 'V2__Add_review_moderation', file: 'V2__Add_review_moderation.sql', checkColumn: { table: 'reviews', column: 'status' } },
      { version: 'V3__Add_messages', file: 'V3__Add_messages.sql', checkTable: 'conversations' },
      { version: 'V4__Add_lesson_approval_statuses', file: 'V4__Add_lesson_approval_statuses.sql', checkConstraint: 'lessons_status_check' }
      // Используйте npm run seed для создания тестовых пользователей
    ];
    
    for (const migration of migrations) {
      const isApplied = await isMigrationApplied(migration.version);
      
      if (!isApplied) {
        // Для seed данных просто применяем миграцию
        if (!migration.checkTable && !migration.checkColumn && !migration.checkConstraint) {
          console.log(`Applying seed migration ${migration.version}...`);
          await runMigration(migration.version, migration.file);
        } else if (migration.checkConstraint) {
          // Проверяем, существует ли constraint с нужными значениями
          const constraintExists = await checkLessonsStatusConstraint();
          
          if (!constraintExists) {
            console.log(`Applying migration ${migration.version}...`);
            await runMigration(migration.version, migration.file);
          } else {
            // Constraint существует, но миграция не отмечена - отмечаем её
            console.log(`Constraint ${migration.checkConstraint} exists, marking migration ${migration.version} as applied...`);
            await markMigrationApplied(migration.version);
          }
        } else if (migration.checkColumn) {
          // Проверяем, существует ли колонка
          const columnExists = await checkColumnExists(migration.checkColumn.table, migration.checkColumn.column);
          
          if (!columnExists) {
            console.log(`Applying migration ${migration.version}...`);
            await runMigration(migration.version, migration.file);
          } else {
            // Колонка существует, но миграция не отмечена - отмечаем её
            console.log(`Column ${migration.checkColumn.table}.${migration.checkColumn.column} exists, marking migration ${migration.version} as applied...`);
            await markMigrationApplied(migration.version);
          }
        } else {
          // Проверяем, существует ли таблица
          let tableExists = false;
          if (migration.checkTable === 'users' || migration.checkTable === 'conversations') {
            const result = await pool.query(`
              SELECT table_name 
              FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = $1
            `, [migration.checkTable]);
            tableExists = result.rows.length > 0;
          }
          
          if (!tableExists) {
            console.log(`Applying migration ${migration.version}...`);
            await runMigration(migration.version, migration.file);
          } else {
            // Таблица существует, но миграция не отмечена - отмечаем её
            console.log(`Table ${migration.checkTable} exists, marking migration ${migration.version} as applied...`);
            await markMigrationApplied(migration.version);
          }
        }
      }
    }
    
    console.log('✓ Database is up to date');
  } catch (error) {
    console.error('Migration initialization error:', error);
    throw error;
  }
};

