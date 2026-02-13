import { Card, CardContent } from "@/components/ui/card";

export default function StudentResults() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Results</h1>
        <p className="text-muted-foreground">View your test scores and feedback</p>
      </div>
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Results view coming in next iteration.
        </CardContent>
      </Card>
    </div>
  );
}
