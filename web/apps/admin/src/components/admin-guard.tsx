"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let active = true;

    const verify = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace("/login");
        return;
      }

      const { data: admin, error } = await supabase
        .from("admin_users")
        .select("id, email, name, role")
        .eq("email", session.user.email)
        .single();

      if (error || !admin) {
        await supabase.auth.signOut();
        localStorage.removeItem("admin_user");
        router.replace("/login");
        return;
      }

      localStorage.setItem("admin_user", JSON.stringify(admin));
      if (active) setAuthorized(true);
    };

    verify();
    return () => {
      active = false;
    };
  }, [router]);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-stone-200 border-t-amber-500" />
      </div>
    );
  }

  return children;
}
