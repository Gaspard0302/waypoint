import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900">
        Welcome back{user?.email ? `, ${user.email}` : ""}
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Your Waypoint dashboard. Sites and analytics coming in Phase 2.
      </p>
    </div>
  );
}
