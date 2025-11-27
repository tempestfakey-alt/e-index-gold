import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface RecordGradesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  onSuccess?: () => void;
}

interface EnrolledStudent {
  id: string;
  student_id: string;
  students: {
    full_name: string;
    student_number: string;
  };
}

const RecordGradesDialog = ({
  open,
  onOpenChange,
  subjectId,
  onSuccess,
}: RecordGradesDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [gradeType, setGradeType] = useState<"exam" | "quiz" | "activity" | "">("");
  const [title, setTitle] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [scores, setScores] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      fetchEnrolledStudents();
    }
  }, [open, subjectId]);

  const fetchEnrolledStudents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("enrollments")
      .select(`
        id,
        student_id,
        students (
          full_name,
          student_number
        )
      `)
      .eq("subject_id", subjectId);

    if (data) {
      setStudents(data as EnrolledStudent[]);
    }
    setLoading(false);
  };

  const handleScoreChange = (enrollmentId: string, value: string) => {
    setScores((prev) => ({ ...prev, [enrollmentId]: value }));
  };

  const handleSubmit = async () => {
    if (!gradeType || !title) {
      toast({
        title: "Missing Information",
        description: "Please select grade type and enter a title",
        variant: "destructive",
      });
      return;
    }

    const gradesData = Object.entries(scores)
      .filter(([_, score]) => score && score !== "")
      .map(([enrollmentId, score]) => ({
        enrollment_id: enrollmentId,
        grade_type: gradeType,
        title,
        score: parseFloat(score),
        max_score: parseFloat(maxScore),
      }));

    if (gradesData.length === 0) {
      toast({
        title: "No Scores Entered",
        description: "Please enter at least one score",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("grades").insert(gradesData);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to record grades",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Recorded ${gradesData.length} grades successfully`,
      });
      setGradeType("");
      setTitle("");
      setMaxScore("100");
      setScores({});
      onOpenChange(false);
      onSuccess?.();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-gold bg-clip-text text-transparent">
            Record Grades
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Grade Type</Label>
              <Select value={gradeType} onValueChange={(value) => setGradeType(value as "exam" | "quiz" | "activity")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Midterm Exam"
              />
            </div>

            <div className="space-y-2">
              <Label>Max Score</Label>
              <Input
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                placeholder="100"
              />
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-lg">Enrolled Students</h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : students.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No students enrolled</p>
            ) : (
              <div className="space-y-2">
                {students.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-3 bg-accent/50 rounded-md"
                  >
                    <div>
                      <p className="font-medium">{enrollment.students.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {enrollment.students.student_number}
                      </p>
                    </div>
                    <Input
                      type="number"
                      className="w-24"
                      placeholder="Score"
                      value={scores[enrollment.id] || ""}
                      onChange={(e) => handleScoreChange(enrollment.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Record Grades
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecordGradesDialog;
