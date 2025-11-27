-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('student', 'professor');

-- Create enum for attendance status
CREATE TYPE attendance_status AS ENUM ('present', 'late', 'absent');

-- Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfid TEXT UNIQUE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  student_number TEXT UNIQUE NOT NULL,
  year_section TEXT NOT NULL,
  course TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create professors table
CREATE TABLE public.professors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  staff_id TEXT UNIQUE NOT NULL,
  academic_rank TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID REFERENCES public.professors(id) ON DELETE CASCADE NOT NULL,
  subject_name TEXT NOT NULL,
  subject_code TEXT NOT NULL,
  units INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  days TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create enrollments table
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(subject_id, student_id)
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status attendance_status NOT NULL,
  scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(enrollment_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table (public read for RFID scanning)
CREATE POLICY "Anyone can read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Anyone can insert users" ON public.users FOR INSERT WITH CHECK (true);

-- RLS Policies for students table
CREATE POLICY "Anyone can read students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Anyone can insert students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update students" ON public.students FOR UPDATE USING (true);

-- RLS Policies for professors table
CREATE POLICY "Anyone can read professors" ON public.professors FOR SELECT USING (true);
CREATE POLICY "Anyone can insert professors" ON public.professors FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update professors" ON public.professors FOR UPDATE USING (true);

-- RLS Policies for subjects table
CREATE POLICY "Anyone can read subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Anyone can insert subjects" ON public.subjects FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update subjects" ON public.subjects FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete subjects" ON public.subjects FOR DELETE USING (true);

-- RLS Policies for enrollments table
CREATE POLICY "Anyone can read enrollments" ON public.enrollments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert enrollments" ON public.enrollments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete enrollments" ON public.enrollments FOR DELETE USING (true);

-- RLS Policies for attendance table
CREATE POLICY "Anyone can read attendance" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Anyone can insert attendance" ON public.attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update attendance" ON public.attendance FOR UPDATE USING (true);