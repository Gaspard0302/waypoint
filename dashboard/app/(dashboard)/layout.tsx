import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { Separator } from "@/components/ui/separator";
import NavLink from "@/components/NavLink";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const devSession = cookieStore.get("wp_dev_session")?.value;

  let userEmail: string | null = null;

  if (devSession === "1") {
    // Dev bypass — no real Supabase session needed
    userEmail = "admin";
  } else {
    // Real Supabase auth
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) redirect("/login");
      userEmail = user.email ?? null;
    } catch {
      redirect("/login");
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r border-zinc-200 bg-white px-4 py-6">
        <div className="mb-6">
          <span className="text-lg font-semibold tracking-tight text-zinc-900">
            Waypoint
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          <NavLink href="/dashboard" exact>Overview</NavLink>
          <NavLink href="/dashboard/sites">Sites</NavLink>
        </nav>

        <Separator className="my-4" />

        <div className="space-y-2">
          <p className="truncate px-3 text-xs text-zinc-500">{userEmail}</p>
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-0 bg-zinc-50 overflow-auto">{children}</main>
    </div>
  );
}
