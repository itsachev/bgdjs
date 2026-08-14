import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({ params }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return <LoginForm dict={dict} locale={locale} />;
}
