import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnrollStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  onSuccess: () => void;
}

interface Student {
  id: string;
  full_name: string;
  student_number: string;
  year_section: string;
  course: string;
  user_id: string;
  users: {
    rfid: string;
  };
}

const EnrollStudentDialog = ({ open, onOpenChange, subjectId, onSuccess }: EnrollStudentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [enrolledStudentIds, setEnrolledStudentIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      fetchStudents();
      fetchEnrolledStudents();
    }
  }, [open, subjectId]);

  const fetchStudents = async () => {
    const { data } = await supabase
      .from("students")
      .select("*, users(rfid)")
      .order("full_name");

    if (data) {
      setStudents(data as any);
    }
  };

  const fetchEnrolledStudents = async () => {
    const { data } = await supabase
      .from("enrollments")
      .select("student_id")
      .eq("subject_id", subjectId);

    if (data) {
      setEnrolledStudentIds(data.map((e) => e.student_id));
    }
  };

  const handleEnroll = async (studentId: string) => {
    setLoading(true);

    try {
      const { error } = await supabase.from("enrollments").insert({
        subject_id: subjectId,
        student_id: studentId,
      });

      if (error) throw error;

      toast.success("Student enrolled successfully!");
      fetchEnrolledStudents();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async (studentId: string) => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from("enrollments")
        .delete()
        .eq("subject_id", subjectId)
        .eq("student_id", studentId);

      if (error) throw error;

      toast.success("Student unenrolled successfully!");
      fetchEnrolledStudents();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.student_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.users.rfid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-gold bg-clip-text text-transparent">
            Enroll Students
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, student number, or RFID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="border rounded-lg max-h-96 overflow-y-auto">
            {filteredStudents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No students found.</p>
            ) : (
              <div className="divide-y">
                {filteredStudents.map((student) => {
                  const isEnrolled = enrolledStudentIds.includes(student.id);
                  return (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-semibold">{student.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {student.student_number} • {student.year_section} • {student.course}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">RFID: {student.users.rfid}</div>
                      </div>
                      <Button
                        size="sm"
                        variant={isEnrolled ? "destructive" : "default"}
                        onClick={() => (isEnrolled ? handleUnenroll(student.id) : handleEnroll(student.id))}
                        disabled={loading}
                      >
                        {isEnrolled ? "Unenroll" : "Enroll"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnrollStudentDialog;
