import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, BookOpen, Users, Calendar, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import CreateSubjectDialog from "@/components/CreateSubjectDialog";
import EnrollStudentDialog from "@/components/EnrollStudentDialog";
import RecordGradesDialog from "@/components/RecordGradesDialog";

interface Subject {
  id: string;
  subject_name: string;
  subject_code: string;
  units: number;
  start_time: string;
  end_time: string;
  days: string[];
  _count?: {
    enrollments: number;
  };
}

const ProfessorDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userId = location.state?.userId;

  const [professor, setProfessor] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [gradesDialogOpen, setGradesDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }

    fetchProfessorData();
  }, [userId]);

  const fetchProfessorData = async () => {
    const { data: professorData } = await supabase
      .from("professors")
      .select("*")
      .eq("user_id", userId)
      .single();

    setProfessor(professorData);

    if (professorData) {
      fetchSubjects(professorData.id);
    }
  };

  const fetchSubjects = async (professorId: string) => {
    const { data: subjectsData } = await supabase
      .from("subjects")
      .select("*, enrollments(count)")
      .eq("professor_id", professorId);

    if (subjectsData) {
      const subjectsWithCount = subjectsData.map((s: any) => ({
        ...s,
        _count: { enrollments: s.enrollments?.[0]?.count || 0 },
      }));
      setSubjects(subjectsWithCount);
    }
  };

  const handleEnrollClick = (subjectId: string) => {
    setSelectedSubject(subjectId);
    setEnrollDialogOpen(true);
  };

  const handleGradesClick = (subjectId: string) => {
    setSelectedSubject(subjectId);
    setGradesDialogOpen(true);
  };

  if (!professor) return <div className="min-h-screen bg-gradient-gold-subtle flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-gold-subtle p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="shadow-gold">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-gold bg-clip-text text-transparent">
                  Professor Dashboard
                </CardTitle>
                <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                  <span>{professor.full_name}</span>
                  <span>Staff ID: {professor.staff_id}</span>
                  <span>{professor.academic_rank}</span>
                </div>
              </div>
              <Button onClick={() => setCreateDialogOpen(true)} className="shadow-gold">
                <Plus className="h-4 w-4 mr-2" />
                Create Subject
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card className="shadow-gold">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              My Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subjects.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No subjects created yet. Create your first subject!</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {subjects.map((subject) => (
                  <Card key={subject.id} className="hover:shadow-gold transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{subject.subject_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{subject.subject_code}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1 text-sm">
                        <p>
                          <strong>Units:</strong> {subject.units}
                        </p>
                        <p>
                          <strong>Time:</strong> {subject.start_time} - {subject.end_time}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {subject.days.map((day) => (
                          <Badge key={day} variant="secondary">
                            {day.slice(0, 3)}
                          </Badge>
                        ))}
                      </div>

                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{subject._count?.enrollments || 0} students</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEnrollClick(subject.id)} className="flex-1">
                            Enroll Students
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleGradesClick(subject.id)} className="flex-1">
                            <ClipboardList className="h-4 w-4 mr-1" />
                            Record Grades
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateSubjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        professorId={professor.id}
        onSuccess={() => fetchSubjects(professor.id)}
      />

      {selectedSubject && (
        <>
          <EnrollStudentDialog
            open={enrollDialogOpen}
            onOpenChange={setEnrollDialogOpen}
            subjectId={selectedSubject}
            onSuccess={() => fetchSubjects(professor.id)}
          />
          <RecordGradesDialog
            open={gradesDialogOpen}
            onOpenChange={setGradesDialogOpen}
            subjectId={selectedSubject}
            onSuccess={() => fetchSubjects(professor.id)}
          />
        </>
      )}
    </div>
  );
};

export default ProfessorDashboard;
