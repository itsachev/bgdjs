import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../../dictionaries";
import { SignupForm } from "@/components/signup-form";
import { Modal } from "@/components/modal";

export default async function InterceptedSignupPage({ params }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <Modal widthClassName="max-w-2xl">
      <SignupForm dict={dict} locale={locale} embedded />
    </Modal>
  );
}
