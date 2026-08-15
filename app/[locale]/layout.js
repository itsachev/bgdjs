import { Inter, Unbounded } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SmoothScrollProvider } from "@/components/smooth-scroll-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SiteAudio } from "@/components/site-audio";
import { getDictionary, hasLocale, locales } from "./dictionaries";
import { notFound } from "next/navigation";

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
});

const displayFont = Unbounded({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700", "800"],
});

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return {
    title: {
      default: "BGDj's",
      template: "%s | BGDj's",
    },
    description: dict.meta.description,
  };
}

export default async function RootLayout({ children, params }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${bodyFont.variable} ${displayFont.variable}`}
    >
      <body className="min-h-full antialiased">
        <ThemeProvider>
          <SmoothScrollProvider>
            <div aria-hidden="true" className="bg-grain" />
            <div className="flex min-h-screen flex-col">
              <SiteHeader locale={locale} dict={dict} />
              <main className="flex flex-1 flex-col">{children}</main>
              <SiteFooter locale={locale} dict={dict} />
            </div>
            <SiteAudio />
          </SmoothScrollProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
