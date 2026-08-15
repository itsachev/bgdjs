import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, hasLocale } from "../../dictionaries";
import { EventCreateForm } from "@/components/event-create-form";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return {
    title: dict.eventCreate.title,
    robots: { index: false, follow: false },
  };
}

export default async function EventCreatePage({ params }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/login`);

  return <EventCreateForm locale={locale} userId={user.id} t={dict.eventCreate} />;
}
