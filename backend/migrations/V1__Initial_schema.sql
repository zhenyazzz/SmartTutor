CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'TUTOR', 'ADMIN')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE tutors (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    education TEXT,
    experience_years INT,
    bio TEXT,
    rating NUMERIC(3,2) DEFAULT 0,
    hourly_rate NUMERIC(8,2),
    location VARCHAR(100),
    avatar_url VARCHAR(255),
    phone VARCHAR(20)
);

CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE tutor_subjects (
    tutor_id INT REFERENCES tutors(id) ON DELETE CASCADE,
    subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
    PRIMARY KEY (tutor_id, subject_id)
);

CREATE TABLE schedule_slots (
    id SERIAL PRIMARY KEY,
    tutor_id INT NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    day_of_week VARCHAR(15) NOT NULL CHECK (day_of_week IN ('MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    CONSTRAINT schedule_slots_end_after_start CHECK (end_time > start_time)
);

CREATE UNIQUE INDEX idx_tutor_slot_unique ON schedule_slots(tutor_id, day_of_week, start_time);

CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    tutor_id INT NOT NULL REFERENCES tutors(id),
    student_id INT NOT NULL REFERENCES users(id),
    subject_id INT NOT NULL REFERENCES subjects(id),
    date_time TIMESTAMP NOT NULL,
    duration INT,
    price NUMERIC(8,2),
    status VARCHAR(20) CHECK (status IN ('PLANNED', 'COMPLETED', 'CANCELLED'))
);

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    tutor_id INT REFERENCES tutors(id) ON DELETE CASCADE,
    student_id INT REFERENCES users(id) ON DELETE CASCADE,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analytics (
    id SERIAL PRIMARY KEY,
    tutor_id INT REFERENCES tutors(id) ON DELETE CASCADE,
    month INT CHECK (month BETWEEN 1 AND 12),
    year INT,
    lessons_count INT DEFAULT 0,
    students_count INT DEFAULT 0,
    average_rating NUMERIC(3,2)
);

CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

