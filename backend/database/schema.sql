CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name TEXT NOT NULL,
  district TEXT NOT NULL,
  total_students INTEGER NOT NULL DEFAULT 0 CHECK (total_students >= 0)
);

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id),
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  guardian_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE scholarship_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PAID','FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Same key + method is replayed rather than processed twice.
CREATE TABLE idempotency_keys (
  key TEXT NOT NULL,
  method TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_status INTEGER,
  response_body JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (key, method)
);

CREATE TABLE audit_events (
  id BIGSERIAL PRIMARY KEY,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
REVOKE UPDATE, DELETE ON audit_events FROM PUBLIC;

CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_payments_student ON scholarship_payments(student_id);

-- Assessment SQL answer: top five schools by enrollment.
-- SELECT id, school_name, district, total_students FROM schools
-- ORDER BY total_students DESC LIMIT 5;

