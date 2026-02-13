import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export default function StudentProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: "", cgpa: "", yearOfPassing: "" });
  const [completion, setCompletion] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        setForm({
          name: data.name ?? "",
          cgpa: data.cgpa?.toString() ?? "",
          yearOfPassing: data.year_of_passing?.toString() ?? "",
        });
        setCompletion(data.profile_completion_percentage ?? 0);
      }
    });
  }, [user]);

  const calcCompletion = () => {
    let score = 0;
    if (form.name.trim()) score += 33;
    if (form.cgpa) score += 33;
    if (form.yearOfPassing) score += 34;
    return score;
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const newCompletion = calcCompletion();
    const { error } = await supabase.from("profiles").update({
      name: form.name,
      cgpa: parseFloat(form.cgpa) || null,
      year_of_passing: parseInt(form.yearOfPassing) || null,
      profile_completion_percentage: newCompletion,
    }).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setCompletion(newCompletion);
    toast.success("Profile updated");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Update your details and upload your resume</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Profile Completion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={completion} className="h-3" />
          <p className="text-sm text-muted-foreground">{completion}% complete</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CGPA</Label>
              <Input type="number" step="0.01" max="10" value={form.cgpa} onChange={(e) => setForm({ ...form, cgpa: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Year of Passing</Label>
              <Input type="number" value={form.yearOfPassing} onChange={(e) => setForm({ ...form, yearOfPassing: e.target.value })} />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Profile"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
