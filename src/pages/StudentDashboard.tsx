import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Subject {
  id: string;
  subject_name: string;
  subject_code: string;
  start_time: string;
  end_time: string;
  days: string[];
  professor: {
    full_name: string;
  };
}

const StudentDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userId = location.state?.userId;

  const [student, setStudent] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [nextClass, setNextClass] = useState<Subject | null>(null);

  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }

    fetchStudentData();
  }, [userId]);

  const fetchStudentData = async () => {
    const { data: studentData } = await supabase
      .from("students")
      .select("*")
      .eq("user_id", userId)
      .single();

    setStudent(studentData);

    if (studentData) {
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select(
          `
          subject_id,
          subjects (
            id,
            subject_name,
            subject_code,
            start_time,
            end_time,
            days,
            professors (
              full_name
            )
          )
        `
        )
        .eq("student_id", studentData.id);

      if (enrollments) {
        const subjectsList = enrollments.map((e: any) => ({
          ...e.subjects,
          professor: e.subjects.professors,
        }));
        setSubjects(subjectsList);
        findNextClass(subjectsList);
      }
    }
  };

  const findNextClass = (subjectsList: Subject[]) => {
    const now = new Date();
    const currentDay = format(now, "EEEE");
    const currentTime = format(now, "HH:mm");

    const todayClasses = subjectsList.filter((s) => s.days.includes(currentDay));

    const upcomingClass = todayClasses.find((s) => s.start_time > currentTime);

    setNextClass(upcomingClass || null);
  };

  if (!student) return <div className="min-h-screen bg-gradient-gold-subtle flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-gold-subtle p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="shadow-gold">
          <CardHeader>
            <CardTitle className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent">
              Welcome, {student.full_name}
            </CardTitle>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Student No: {student.student_number}</span>
              <span>Year & Section: {student.year_section}</span>
              <span>Course: {student.course}</span>
            </div>
          </CardHeader>
        </Card>

        {nextClass && (
          <Card className="border-primary shadow-gold-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Next Class
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{nextClass.subject_name}</h3>
                <p className="text-muted-foreground">{nextClass.subject_code}</p>
                <p className="text-sm">
                  <strong>Time:</strong> {nextClass.start_time} - {nextClass.end_time}
                </p>
                <p className="text-sm">
                  <strong>Professor:</strong> {nextClass.professor.full_name}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-gold">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              My Class Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subjects.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No enrolled subjects yet.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {subjects.map((subject) => (
                  <Card key={subject.id} className="hover:shadow-gold transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{subject.subject_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{subject.subject_code}</p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-primary" />
                        {subject.start_time} - {subject.end_time}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <div className="flex flex-wrap gap-1">
                          {subject.days.map((day) => (
                            <Badge key={day} variant="secondary">
                              {day.slice(0, 3)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">Prof. {subject.professor.full_name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
