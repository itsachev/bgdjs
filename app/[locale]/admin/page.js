import { Children } from "react";
import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { HeroEditor } from "@/components/hero-editor";
import { LoginBackgroundEditor } from "@/components/login-background-editor";
import { SignupBackgroundEditor } from "@/components/signup-background-editor";
import { SiteAudioEditor } from "@/components/site-audio-editor";
import { EventsSectionEditor } from "@/components/events-section-editor";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

function AdminCard({ title, children }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-background-elevated/40 p-6">
      <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
      {children}
    </div>
  );
}

// A lone card (e.g. Site audio — there's only ever one) stays at a contained
// width instead of stretching across the grid; groups with more than one
// card get exactly as many columns as they have cards, capped at 3, so a
// two-card group never leaves a dead empty third column.
function AdminGroup({ title, children }) {
  const count = Children.count(children);

  return (
    <section className="mt-16">
      <h2 className="font-display text-xl font-semibold tracking-tight text-accent">{title}</h2>
      <div
        className={
          count > 1
            ? `mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2${count > 2 ? " xl:grid-cols-3" : ""}`
            : "mt-6 max-w-md"
        }
      >
        {children}
      </div>
    </section>
  );
}

export default async function AdminPage() {
  if (!(await isAdmin())) notFound();

  const supabase = await createClient();
  const { data: hero } = await supabase.from("hero_content").select("*").eq("id", 1).maybeSingle();
  const { data: eventsSection } = await supabase
    .from("events_section_content")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  const { data: loginBackground } = await supabase.from("login_content").select("*").eq("id", 1).maybeSingle();
  const { data: signupBackground } = await supabase.from("signup_content").select("*").eq("id", 1).maybeSingle();
  const { data: siteAudio } = await supabase.from("site_audio").select("*").eq("id", 1).maybeSingle();

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Admin</h1>
      <p className="mt-3 text-foreground-muted">
        Content management for DJs, clubs, events, and mixes goes here.
      </p>

      <AdminGroup title="Homepage">
        <AdminCard title="Hero section">
          <HeroEditor initial={hero} />
        </AdminCard>
        <AdminCard title="Upcoming events section">
          <EventsSectionEditor initial={eventsSection} />
        </AdminCard>
      </AdminGroup>

      <hr className="mt-16 border-border" />

      <AdminGroup title="Auth pages">
        <AdminCard title="Login page background">
          <LoginBackgroundEditor initial={loginBackground} />
        </AdminCard>
        <AdminCard title="Signup page background">
          <SignupBackgroundEditor initial={signupBackground} />
        </AdminCard>
      </AdminGroup>

      <hr className="mt-16 border-border" />

      <AdminGroup title="Site">
        <AdminCard title="Site audio">
          <SiteAudioEditor initial={siteAudio} />
        </AdminCard>
      </AdminGroup>
    </div>
  );
}
