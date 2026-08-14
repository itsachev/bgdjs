import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { HeroEditor } from "@/components/hero-editor";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!(await isAdmin())) notFound();

  const supabase = await createClient();
  const { data: hero } = await supabase.from("hero_content").select("*").eq("id", 1).maybeSingle();

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
    </div>
  );
}
