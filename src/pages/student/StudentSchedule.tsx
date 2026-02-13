import { Card, CardContent } from "@/components/ui/card";

export default function StudentSchedule() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
        <p className="text-muted-foreground">View your upcoming test schedule</p>
      </div>
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Schedule view coming in next iteration.
        </CardContent>
      </Card>
    </div>
  );
}
