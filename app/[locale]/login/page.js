import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import { LoginForm } from "@/components/login-form";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return { title: dict.auth.login.title, description: dict.auth.login.metaDescription };
}

export default async function LoginPage({ params }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const { data: background } = await supabase.from("login_content").select("*").eq("id", 1).maybeSingle();

  return <LoginForm dict={dict} locale={locale} background={background} />;
}
