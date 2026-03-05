import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
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

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    setRole(data?.role ?? null);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchRole(session.user.id), 0);
        } else {
          setRole(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Check student session guard: if no sessionStorage flag, they need to re-login
        const isReturning = !sessionStorage.getItem("student_session_active");
        fetchRole(session.user.id).then(() => {
          // We'll handle the logout in a separate effect after role is loaded
        });
        if (isReturning) {
          // Mark that we need to check if student should be logged out
          sessionStorage.setItem("_check_student_session", "true");
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Student session guard: log out students who closed their browser
  useEffect(() => {
    if (loading || !user || !role) return;
    const needsCheck = sessionStorage.getItem("_check_student_session");
    if (needsCheck && role === "student") {
      sessionStorage.removeItem("_check_student_session");
      // Student is returning after closing browser - sign them out
      supabase.auth.signOut();
      return;
    }
    if (needsCheck) {
      sessionStorage.removeItem("_check_student_session");
    }
    // Mark session as active for students
    if (role === "student") {
      sessionStorage.setItem("student_session_active", "true");
    }
  }, [loading, user, role]);

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
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
