import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const rfid = location.state?.rfid;

  const [studentData, setStudentData] = useState({
    fullName: "",
    studentNumber: "",
    yearSection: "",
    course: "",
  });

  const [professorData, setProfessorData] = useState({
    fullName: "",
    staffId: "",
    academicRank: "",
  });

  const [loading, setLoading] = useState(false);

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .insert({ rfid, role: "student" })
        .select()
        .single();

      if (userError) throw userError;

      const { error: studentError } = await supabase.from("students").insert({
        user_id: userData.id,
        full_name: studentData.fullName,
        student_number: studentData.studentNumber,
        year_section: studentData.yearSection,
        course: studentData.course,
      });

      if (studentError) throw studentError;

      toast.success("Registration successful!");
      navigate("/student", { state: { userId: userData.id } });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfessorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .insert({ rfid, role: "professor" })
        .select()
        .single();

      if (userError) throw userError;

      const { error: professorError } = await supabase.from("professors").insert({
        user_id: userData.id,
        full_name: professorData.fullName,
        staff_id: professorData.staffId,
        academic_rank: professorData.academicRank,
      });

      if (professorError) throw professorError;

      toast.success("Registration successful!");
      navigate("/professor", { state: { userId: userData.id } });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!rfid) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-gold-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-gold">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center bg-gradient-gold bg-clip-text text-transparent">
            New Registration
          </CardTitle>
          <CardDescription className="text-center">
            RFID: <span className="font-mono font-semibold text-primary">{rfid}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="student" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="professor">Professor</TabsTrigger>
            </TabsList>

            <TabsContent value="student">
              <form onSubmit={handleStudentSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    required
                    value={studentData.fullName}
                    onChange={(e) => setStudentData({ ...studentData, fullName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentNumber">Student Number</Label>
                  <Input
                    id="studentNumber"
                    required
                    value={studentData.studentNumber}
                    onChange={(e) => setStudentData({ ...studentData, studentNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearSection">Year & Section</Label>
                  <Input
                    id="yearSection"
                    placeholder="e.g., 3-A"
                    required
                    value={studentData.yearSection}
                    onChange={(e) => setStudentData({ ...studentData, yearSection: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course">Course</Label>
                  <Input
                    id="course"
                    placeholder="e.g., Computer Science"
                    required
                    value={studentData.course}
                    onChange={(e) => setStudentData({ ...studentData, course: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Registering..." : "Register as Student"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="professor">
              <form onSubmit={handleProfessorSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="profFullName">Full Name</Label>
                  <Input
                    id="profFullName"
                    required
                    value={professorData.fullName}
                    onChange={(e) => setProfessorData({ ...professorData, fullName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="staffId">Staff ID</Label>
                  <Input
                    id="staffId"
                    required
                    value={professorData.staffId}
                    onChange={(e) => setProfessorData({ ...professorData, staffId: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academicRank">Academic Rank</Label>
                  <Input
                    id="academicRank"
                    placeholder="e.g., Associate Professor"
                    required
                    value={professorData.academicRank}
                    onChange={(e) => setProfessorData({ ...professorData, academicRank: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Registering..." : "Register as Professor"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
