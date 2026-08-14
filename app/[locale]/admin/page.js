import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { HeroEditor } from "@/components/hero-editor";
import { LoginBackgroundEditor } from "@/components/login-background-editor";
import { SignupBackgroundEditor } from "@/components/signup-background-editor";
import { SiteAudioEditor } from "@/components/site-audio-editor";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!(await isAdmin())) notFound();

  const supabase = await createClient();
  const { data: hero } = await supabase.from("hero_content").select("*").eq("id", 1).maybeSingle();
  const { data: loginBackground } = await supabase.from("login_content").select("*").eq("id", 1).maybeSingle();
  const { data: signupBackground } = await supabase.from("signup_content").select("*").eq("id", 1).maybeSingle();
  const { data: siteAudio } = await supabase.from("site_audio").select("*").eq("id", 1).maybeSingle();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Admin</h1>
      <p className="mt-3 text-foreground-muted">
        Content management for DJs, clubs, events, and mixes goes here.
      </p>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold tracking-tight">Hero section</h2>
        <HeroEditor initial={hero} />
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold tracking-tight">Login page background</h2>
        <LoginBackgroundEditor initial={loginBackground} />
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold tracking-tight">Signup page background</h2>
        <SignupBackgroundEditor initial={signupBackground} />
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold tracking-tight">Site audio</h2>
        <SiteAudioEditor initial={siteAudio} />
      </section>
    </div>
  );
}
