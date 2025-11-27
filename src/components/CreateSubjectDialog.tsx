import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professorId: string;
  onSuccess: () => void;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const CreateSubjectDialog = ({ open, onOpenChange, professorId, onSuccess }: CreateSubjectDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subjectName: "",
    subjectCode: "",
    units: "",
    startTime: "",
    endTime: "",
    days: [] as string[],
  });

  const handleDayToggle = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.days.length === 0) {
        toast.error("Please select at least one day");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("subjects").insert({
        professor_id: professorId,
        subject_name: formData.subjectName,
        subject_code: formData.subjectCode,
        units: parseInt(formData.units),
        start_time: formData.startTime,
        end_time: formData.endTime,
        days: formData.days,
      });

      if (error) throw error;

      toast.success("Subject created successfully!");
      onSuccess();
      onOpenChange(false);
      setFormData({
        subjectName: "",
        subjectCode: "",
        units: "",
        startTime: "",
        endTime: "",
        days: [],
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-gold bg-clip-text text-transparent">
            Create New Subject
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subjectName">Subject Name</Label>
              <Input
                id="subjectName"
                required
                value={formData.subjectName}
                onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subjectCode">Subject Code</Label>
              <Input
                id="subjectCode"
                required
                value={formData.subjectCode}
                onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="units">Number of Units</Label>
            <Input
              id="units"
              type="number"
              min="1"
              required
              value={formData.units}
              onChange={(e) => setFormData({ ...formData, units: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Days</Label>
            <div className="grid grid-cols-3 gap-3">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={day}
                    checked={formData.days.includes(day)}
                    onCheckedChange={() => handleDayToggle(day)}
                  />
                  <label
                    htmlFor={day}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {day}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Subject"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSubjectDialog;
