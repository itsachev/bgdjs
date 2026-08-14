import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import { SignupForm } from "@/components/signup-form";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return { title: dict.auth.signup.title, description: dict.auth.signup.metaDescription };
}

export default async function SignupPage({ params }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return <SignupForm dict={dict} locale={locale} />;
}
