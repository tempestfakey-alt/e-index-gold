import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, BookOpen, Users, Calendar, ClipboardList, Award, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface Grade {
  id: string;
  title: string;
  grade_type: string;
  score: number;
  max_score: number;
  date_recorded: string;
  enrollments: {
    students: {
      full_name: string;
      student_number: string;
    };
  };
}

interface Attendance {
  id: string;
  date: string;
  status: string;
  scanned_at: string;
  enrollments: {
    students: {
      full_name: string;
      student_number: string;
    };
    subjects: {
      subject_name: string;
      subject_code: string;
    };
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
  const [grades, setGrades] = useState<Record<string, Grade[]>>({});
  const [attendance, setAttendance] = useState<Attendance[]>([]);

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
      fetchAttendance(professorData.id);
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
      
      // Fetch grades for each subject
      subjectsWithCount.forEach(subject => {
        fetchGradesForSubject(subject.id);
      });
    }
  };

  const fetchGradesForSubject = async (subjectId: string) => {
    const { data: gradesData } = await supabase
      .from("grades")
      .select(`
        *,
        enrollments (
          students (
            full_name,
            student_number
          )
        )
      `)
      .eq("enrollments.subject_id", subjectId)
      .order("date_recorded", { ascending: false });

    if (gradesData) {
      setGrades(prev => ({ ...prev, [subjectId]: gradesData as Grade[] }));
    }
  };

  const fetchAttendance = async (professorId: string) => {
    // Get all subjects for this professor
    const { data: professorSubjects } = await supabase
      .from("subjects")
      .select("id")
      .eq("professor_id", professorId);

    if (!professorSubjects) return;

    const subjectIds = professorSubjects.map(s => s.id);

    // Fetch attendance for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: attendanceData } = await supabase
      .from("attendance")
      .select(`
        *,
        enrollments (
          subject_id,
          students (
            full_name,
            student_number
          ),
          subjects (
            subject_name,
            subject_code
          )
        )
      `)
      .in("enrollments.subject_id", subjectIds)
      .gte("date", sevenDaysAgo.toISOString().split('T')[0])
      .order("date", { ascending: false })
      .order("scanned_at", { ascending: false });

    if (attendanceData) {
      setAttendance(attendanceData as Attendance[]);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-500/20 text-green-700 dark:text-green-400";
      case "late":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
      case "absent":
        return "bg-red-500/20 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400";
    }
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
                    <Collapsible>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{subject.subject_name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{subject.subject_code}</p>
                          </div>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </CollapsibleTrigger>
                        </div>
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

                        <CollapsibleContent className="space-y-4 pt-4 border-t">
                          {/* Grades Section */}
                          <div>
                            <h4 className="font-semibold flex items-center gap-2 mb-3">
                              <Award className="h-4 w-4 text-primary" />
                              Recorded Grades
                            </h4>
                            {!grades[subject.id] || grades[subject.id].length === 0 ? (
                              <p className="text-sm text-muted-foreground">No grades recorded yet</p>
                            ) : (
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {grades[subject.id].map((grade) => (
                                  <div
                                    key={grade.id}
                                    className="text-sm p-3 bg-accent/30 rounded-md space-y-1"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium">{grade.title}</span>
                                      <Badge variant="outline" className="capitalize">
                                        {grade.grade_type}
                                      </Badge>
                                    </div>
                                    <div className="text-muted-foreground">
                                      <p>{grade.enrollments.students.full_name}</p>
                                      <p className="text-xs">
                                        {grade.enrollments.students.student_number}
                                      </p>
                                    </div>
                                    <div className="flex items-center justify-between pt-1">
                                      <span className="text-xs">{formatDate(grade.date_recorded)}</span>
                                      <span className="font-semibold text-primary">
                                        {grade.score}/{grade.max_score}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </CardContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Records */}
        <Card className="shadow-gold">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Recent Attendance (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendance.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No attendance records yet</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {formatDate(record.date)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {record.enrollments.students.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {record.enrollments.students.student_number}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {record.enrollments.subjects.subject_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {record.enrollments.subjects.subject_code}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(record.status)}>
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatTime(record.scanned_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateSubjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        professorId={professor.id}
            onSuccess={() => {
              fetchSubjects(professor.id);
              fetchAttendance(professor.id);
            }}
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
