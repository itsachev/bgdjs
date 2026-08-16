import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import { SignupForm } from "@/components/signup-form";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return { title: dict.auth.signup.title, description: dict.auth.signup.metaDescription };
}

export default async function SignupPage({ params, searchParams }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  const { next } = await searchParams;

  const supabase = await createClient();
  const { data: background } = await supabase.from("signup_content").select("*").eq("id", 1).maybeSingle();

  return <SignupForm dict={dict} locale={locale} background={background} next={next} />;
}
