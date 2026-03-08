import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getAuthRedirects } from "@/lib/authRedirects";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (userId: string): Promise<AppRole | null> => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    const r = data?.role ?? null;
    setRole(r);
    return r;
  };

  useEffect(() => {
    let initialLoad = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const userRole = await fetchRole(session.user.id);
        const isRecoveryFlow =
          window.location.pathname === "/reset-password" ||
          window.location.hash.includes("type=recovery") ||
          new URLSearchParams(window.location.search).get("type") === "recovery" ||
          Boolean(new URLSearchParams(window.location.search).get("token_hash"));

        const isEmailProvider = (session.user.app_metadata?.provider ?? "email") === "email";

        // Student session guard: if browser was closed, log out only email/password sessions.
        // OAuth flows may start in a fresh tab/window and should not be force-signed-out.
        if (userRole === "student" && isEmailProvider && !isRecoveryFlow && !sessionStorage.getItem("student_session_active")) {
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setRole(null);
        } else if (userRole === "student") {
          sessionStorage.setItem("student_session_active", "true");
        }
      }
      setLoading(false);
      initialLoad = false;
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Use setTimeout to avoid blocking supabase-js internal await on listeners
          setTimeout(async () => {
            setLoading(true);
            await fetchRole(session.user.id);
            sessionStorage.setItem("student_session_active", "true");
            setLoading(false);
          }, 0);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: getAuthRedirects().signupVerify,
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    sessionStorage.removeItem("student_session_active");
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, role, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
