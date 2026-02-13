import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentTests() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Tests</h1>
        <p className="text-muted-foreground">View and take scheduled tests</p>
      </div>
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Test-taking interface coming in next iteration.
        </CardContent>
      </Card>
    </div>
  );
}
