import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type HRRole =
  | "company_director"
  | "branch_director"
  | "center_director"
  | "mkt"
  | "sale"
  | "teacher_chinese"
  | "teacher_english"
  | "teacher_korean"
  | "admin";

export type HRProfile = {
  user_id: string;
  role: HRRole;
  branch: string | null;
  center: string | null;
  employee_id: string | null;
};

export function useHRAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<HRProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const client = supabase;
    if (!client) return () => { mounted = false; };
    client.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session);
      if (mounted && data.session) {
        client
          .from("hr_profiles")
          .select("user_id,role,branch,center,employee_id")
          .eq("user_id", data.session.user.id)
          .maybeSingle()
          .then(({ data: p }) => {
            if (mounted) setProfile(p as HRProfile | null);
            if (mounted) setLoading(false);
          });
      } else if (mounted) {
        setLoading(false);
      }
    });

    const { data } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) {
        setProfile(null);
        setLoading(false);
        return;
      }
      client
        .from("hr_profiles")
        .select("user_id,role,branch,center,employee_id")
        .eq("user_id", next.user.id)
        .maybeSingle()
        .then(({ data: p }) => {
          if (mounted) setProfile(p as HRProfile | null);
          if (mounted) setLoading(false);
        });
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return { session, profile, loading };
}
