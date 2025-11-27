-- Create enum for grade types
CREATE TYPE public.grade_type AS ENUM ('exam', 'quiz', 'activity');

-- Create grades table
CREATE TABLE public.grades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  grade_type public.grade_type NOT NULL,
  score NUMERIC NOT NULL,
  max_score NUMERIC NOT NULL DEFAULT 100,
  title TEXT NOT NULL,
  date_recorded TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can insert grades"
  ON public.grades
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read grades"
  ON public.grades
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update grades"
  ON public.grades
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete grades"
  ON public.grades
  FOR DELETE
  USING (true);