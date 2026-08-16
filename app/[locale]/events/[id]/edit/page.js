import { redirect, notFound } from "next/navigation";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { getDictionary, hasLocale } from "../../../dictionaries";
import { EventCreateForm } from "@/components/event-create-form";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return {
    title: dict.eventCreate.editTitle,
    robots: { index: false, follow: false },
  };
}

export default async function EventEditPage({ params }) {
  const { locale, id } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) redirect(`/${locale}/login`);

  const { data: event } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!event) notFound();
  if (event.organizer_id !== user.id) redirect(`/${locale}/events/${id}`);

  return <EventCreateForm locale={locale} userId={user.id} t={dict.eventCreate} event={event} />;
}
