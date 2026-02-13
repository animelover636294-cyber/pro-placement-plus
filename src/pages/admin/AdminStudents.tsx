import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function AdminStudents() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Students</h1>
        <p className="text-muted-foreground">View and manage registered students</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Student List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Student management coming in next iteration.</p>
        </CardContent>
      </Card>
    </div>
  );
}
