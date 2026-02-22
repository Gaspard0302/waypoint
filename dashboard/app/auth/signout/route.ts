import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const cookieStore = await cookies();

  // Clear dev bypass cookie
  cookieStore.delete("wp_dev_session");

  // Also sign out of Supabase if configured
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Supabase not configured — dev session already cleared above
  }

  redirect("/login");
}
