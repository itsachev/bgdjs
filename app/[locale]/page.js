import { getDictionary, hasLocale } from "./dictionaries";
import { notFound } from "next/navigation";
import { Hero } from "@/components/hero";
import { createClient } from "@/lib/supabase/server";

function PlaceholderGrid({ title, count = 3 }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <h2 className="mb-8 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-2xl border border-border bg-background-elevated"
          />
        ))}
      </div>
    </section>
  );
}

export default async function HomePage({ params }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const { data: hero } = await supabase.from("hero_content").select("*").eq("id", 1).maybeSingle();

  return (
    <>
      <Hero dict={dict} locale={locale} hero={hero} />
      <PlaceholderGrid title={dict.sections.djs} />
      <PlaceholderGrid title={dict.sections.clubs} />
      <PlaceholderGrid title={dict.sections.events} />
    </>
  );
}
