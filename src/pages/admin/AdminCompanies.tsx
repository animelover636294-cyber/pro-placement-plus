import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Company = Tables<"companies">;

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState({ name: "", minCgpa: "", yearOfPassing: "", skillsCutoff: "" });

  const fetchCompanies = async () => {
    const { data } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
    setCompanies(data ?? []);
  };

  useEffect(() => { fetchCompanies(); }, []);

  const resetForm = () => {
    setForm({ name: "", minCgpa: "", yearOfPassing: "", skillsCutoff: "" });
    setEditing(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Company name is required"); return; }
    const criteria = {
      min_cgpa: parseFloat(form.minCgpa) || 0,
      year_of_passing: parseInt(form.yearOfPassing) || 0,
      skills_cutoff: parseFloat(form.skillsCutoff) || 0,
    };

    if (editing) {
      const { error } = await supabase.from("companies").update({ name: form.name, eligibility_criteria: criteria }).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Company updated");
    } else {
      const { error } = await supabase.from("companies").insert({ name: form.name, eligibility_criteria: criteria });
      if (error) { toast.error(error.message); return; }
      toast.success("Company added");
    }
    setOpen(false);
    resetForm();
    fetchCompanies();
  };

  const handleEdit = (c: Company) => {
    const criteria = (c.eligibility_criteria as Record<string, number>) ?? {};
    setForm({
      name: c.name,
      minCgpa: String(criteria.min_cgpa ?? ""),
      yearOfPassing: String(criteria.year_of_passing ?? ""),
      skillsCutoff: String(criteria.skills_cutoff ?? ""),
    });
    setEditing(c);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Company deleted");
    fetchCompanies();
  };

  const filtered = companies.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground">Manage placement companies and eligibility</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Company</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Company" : "Add Company"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Min CGPA</Label>
                  <Input type="number" step="0.1" value={form.minCgpa} onChange={(e) => setForm({ ...form, minCgpa: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Year of Passing</Label>
                  <Input type="number" value={form.yearOfPassing} onChange={(e) => setForm({ ...form, yearOfPassing: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Skills Cutoff %</Label>
                  <Input type="number" value={form.skillsCutoff} onChange={(e) => setForm({ ...form, skillsCutoff: e.target.value })} />
                </div>
              </div>
              <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Add"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search companies…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Min CGPA</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Skills Cutoff</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const criteria = (c.eligibility_criteria as Record<string, number>) ?? {};
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{criteria.min_cgpa ?? "—"}</TableCell>
                    <TableCell>{criteria.year_of_passing ?? "—"}</TableCell>
                    <TableCell>{criteria.skills_cutoff ? `${criteria.skills_cutoff}%` : "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No companies found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
