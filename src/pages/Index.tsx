import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Scan, GraduationCap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [rfid, setRfid] = useState("");
  const [loading, setLoading] = useState(false);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfid.trim()) {
      toast.error("Please enter an RFID");
      return;
    }

    setLoading(true);

    try {
      const { data: user } = await supabase
        .from("users")
        .select("id, role")
        .eq("rfid", rfid)
        .single();

      if (!user) {
        navigate("/register", { state: { rfid } });
        return;
      }

      if (user.role === "student") {
        const { data: student } = await supabase
          .from("students")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (student) {
          await processAttendance(student.id);
        }

        navigate("/student", { state: { userId: user.id } });
      } else if (user.role === "professor") {
        navigate("/professor", { state: { userId: user.id } });
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
      setRfid("");
    }
  };

  const processAttendance = async (studentId: string) => {
    try {
      const now = new Date();
      const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
      const currentTime = now.toTimeString().slice(0, 5);
      const currentDate = now.toISOString().split("T")[0];

      const { data: enrollments } = await supabase
        .from("enrollments")
        .select(
          `
          id,
          subjects (
            start_time,
            end_time,
            days
          )
        `
        )
        .eq("student_id", studentId);

      if (!enrollments) return;

      for (const enrollment of enrollments) {
        const subject = enrollment.subjects as any;
        
        if (!subject.days.includes(currentDay)) continue;

        const startTime = subject.start_time;
        const endTime = subject.end_time;

        if (currentTime < startTime || currentTime > endTime) continue;

        const { data: existingAttendance } = await supabase
          .from("attendance")
          .select("id")
          .eq("enrollment_id", enrollment.id)
          .eq("date", currentDate)
          .single();

        if (existingAttendance) continue;

        const startMinutes = parseInt(startTime.split(":")[0]) * 60 + parseInt(startTime.split(":")[1]);
        const currentMinutes = parseInt(currentTime.split(":")[0]) * 60 + parseInt(currentTime.split(":")[1]);
        const minutesLate = currentMinutes - startMinutes;

        let status: "present" | "late" | "absent" = "present";
        if (minutesLate > 30) {
          status = "absent";
        } else if (minutesLate > 15) {
          status = "late";
        }

        await supabase.from("attendance").insert({
          enrollment_id: enrollment.id,
          date: currentDate,
          status: status,
          scanned_at: now.toISOString(),
        });

        toast.success(`Attendance marked as ${status.toUpperCase()}`);
      }
    } catch (error) {
      console.error("Attendance error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-gold-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-gold-glow">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-gold rounded-full shadow-gold">
              <GraduationCap className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold bg-gradient-gold bg-clip-text text-transparent">
            E Index Card System
          </CardTitle>
          <CardDescription className="text-lg">RFID-Based Attendance Management</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleScan} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Scan or enter RFID number"
                value={rfid}
                onChange={(e) => setRfid(e.target.value)}
                className="text-center text-lg font-mono"
                autoFocus
              />
            </div>

            <Button type="submit" className="w-full shadow-gold" size="lg" disabled={loading}>
              <Scan className="h-5 w-5 mr-2" />
              {loading ? "Processing..." : "Scan RFID"}
            </Button>
          </form>

          <div className="mt-8 p-4 bg-secondary/50 rounded-lg text-sm text-muted-foreground">
            <p className="font-semibold mb-2">Instructions:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Scan your RFID card to log in</li>
              <li>New users will be prompted to register</li>
              <li>Attendance is automatically recorded during class hours</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
