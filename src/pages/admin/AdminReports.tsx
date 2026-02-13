import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function AdminReports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">Generate and download placement reports</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Report Generation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Report generation coming in next iteration.</p>
        </CardContent>
      </Card>
    </div>
  );
}
