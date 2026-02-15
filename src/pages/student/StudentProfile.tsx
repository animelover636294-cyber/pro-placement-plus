import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, FileText, Loader2 } from "lucide-react";

export default function StudentProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: "", cgpa: "", yearOfPassing: "", usn: "", branch: "" });
  const [completion, setCompletion] = useState(0);
  const [saving, setSaving] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        setForm({
          name: data.name ?? "",
          cgpa: data.cgpa?.toString() ?? "",
          yearOfPassing: data.year_of_passing?.toString() ?? "",
          usn: (data as Record<string, unknown>).usn as string ?? "",
          branch: (data as Record<string, unknown>).branch as string ?? "",
        });
        setCompletion(data.profile_completion_percentage ?? 0);
        setResumeUrl(data.resume_url);
      }
    });
  }, [user]);

  const calcCompletion = () => {
    let score = 0;
    const fields = [form.name.trim(), form.cgpa, form.yearOfPassing, form.usn.trim(), form.branch.trim()];
    const perField = 100 / (fields.length + 1); // +1 for resume
    fields.forEach((f) => { if (f) score += perField; });
    if (resumeUrl) score += perField;
    return Math.min(Math.round(score), 100);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const newCompletion = calcCompletion();
    const { error } = await supabase.from("profiles").update({
      name: form.name,
      cgpa: parseFloat(form.cgpa) || null,
      year_of_passing: parseInt(form.yearOfPassing) || null,
      usn: form.usn || null,
      branch: form.branch || null,
      profile_completion_percentage: newCompletion,
    } as Record<string, unknown>).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setCompletion(newCompletion);
    toast.success("Profile updated");
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB"); return; }
    if (!file.name.endsWith(".pdf")) { toast.error("Only PDF files are accepted"); return; }

    setUploading(true);
    const path = `${user.id}/resume.pdf`;

    const { error: uploadError } = await supabase.storage.from("resumes").upload(path, file, { upsert: true });
    if (uploadError) { toast.error(uploadError.message); setUploading(false); return; }

    const { error: updateError } = await supabase.from("profiles").update({ resume_url: path }).eq("id", user.id);
    if (updateError) { toast.error(updateError.message); setUploading(false); return; }

    setResumeUrl(path);
    setUploading(false);
    toast.success("Resume uploaded successfully");
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
              <Label>USN</Label>
              <Input value={form.usn} onChange={(e) => setForm({ ...form, usn: e.target.value })} placeholder="e.g. 1BM21CS001" />
            </div>
            <div className="space-y-2">
              <Label>Branch</Label>
              <Input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} placeholder="e.g. Computer Science" />
            </div>
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

      <Card>
        <CardHeader>
          <CardTitle>Resume</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {resumeUrl ? (
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <FileText className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Resume uploaded</p>
                <button onClick={async () => {
                  const { data } = await supabase.storage.from("resumes").createSignedUrl(resumeUrl, 300);
                  if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                }} className="text-xs text-primary hover:underline">View resume</button>
              </div>
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild>
                  <span>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Replace"}</span>
                </Button>
                <input type="file" accept=".pdf" className="hidden" onChange={handleResumeUpload} disabled={uploading} />
              </label>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center hover:border-primary/50 transition-colors">
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
              <p className="text-sm font-medium">{uploading ? "Uploading…" : "Click to upload your resume"}</p>
              <p className="text-xs text-muted-foreground">PDF only, max 5MB</p>
              <input type="file" accept=".pdf" className="hidden" onChange={handleResumeUpload} disabled={uploading} />
            </label>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
