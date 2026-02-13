import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

export default function AdminTests() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Test Management</h1>
        <p className="text-muted-foreground">Create and manage placement tests</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" /> Tests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Test management coming in next iteration.</p>
        </CardContent>
      </Card>
    </div>
  );
}
