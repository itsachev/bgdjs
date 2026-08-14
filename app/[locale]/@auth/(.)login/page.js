import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../../dictionaries";
import { LoginForm } from "@/components/login-form";
import { Modal } from "@/components/modal";

export default async function InterceptedLoginPage({ params }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <Modal widthClassName="max-w-md">
      <LoginForm dict={dict} locale={locale} embedded />
    </Modal>
  );
}
