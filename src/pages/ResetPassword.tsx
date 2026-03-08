import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasNavigatedRef = useRef(false);

  const routeToSignedInArea = async () => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;

    // Small delay to let useAuth pick up the session
    await new Promise((r) => setTimeout(r, 500));

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      hasNavigatedRef.current = false;
      setErrorMessage("This reset link is invalid or expired. Please request a new one.");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const destination = roleData?.role === "admin" ? "/admin" : "/dashboard";
    navigate(`${destination}?force_password_reset=1`, { replace: true });
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        routeToSignedInArea();
      }
    });

    // Also check if already signed in (hash-based recovery auto-signs in)
    const checkExistingSession = async () => {
      // Give Supabase a moment to process hash tokens
      await new Promise((r) => setTimeout(r, 1000));

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user && !hasNavigatedRef.current) {
        await routeToSignedInArea();
      } else if (!session && !hasNavigatedRef.current) {
        // No session and no hash tokens = invalid link
        const hasRecoveryInHash = window.location.hash.includes("type=recovery");
        if (!hasRecoveryInHash) {
          setErrorMessage("Invalid reset link. Please request a new password reset email.");
        }
      }
    };

    checkExistingSession();

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (errorMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Reset link issue</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
            <Button className="mt-2" onClick={() => navigate("/forgot-password", { replace: true })}>
              Request a new reset link
            </Button>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <CardTitle className="text-xl">Signing you in…</CardTitle>
          <CardDescription>Please wait while we secure your account.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
