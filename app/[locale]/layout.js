import { Inter, Unbounded } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SmoothScrollProvider } from "@/components/smooth-scroll-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SiteAudio } from "@/components/site-audio";
import { UnreadMessagesProvider } from "@/components/unread-messages-provider";
import { getDictionary, hasLocale, locales } from "./dictionaries";
import { notFound } from "next/navigation";
import { getCurrentProfile, canUseMessaging } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getUnreadMessageCount } from "@/lib/messaging";

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

  // Computed once here (not inside SiteHeader) so the same profile/count
  // feed both the header's badge and the live context that page content
  // (e.g. an open message thread) needs to resync that same badge —
  // UnreadMessagesProvider has to wrap the whole layout, not just the
  // header, or anything under {children} sees only the default no-op
  // context instead of the header's real one.
  const profile = await getCurrentProfile();
  const canMessage = profile ? canUseMessaging(profile.role) : false;
  const unreadCount = canMessage ? await getUnreadMessageCount(await createClient(), profile.id) : 0;

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${bodyFont.variable} ${displayFont.variable}`}
    >
      <body className="min-h-full antialiased">
        <ThemeProvider>
          <SmoothScrollProvider>
            <UnreadMessagesProvider viewerId={profile?.id ?? null} enabled={canMessage} initialCount={unreadCount}>
              <div className="relative flex min-h-screen flex-col">
                <div aria-hidden="true" className="bg-grain" />
                <SiteHeader locale={locale} dict={dict} profile={profile} canMessage={canMessage} />
                <main className="flex flex-1 flex-col">{children}</main>
                <SiteFooter locale={locale} dict={dict} />
              </div>
            </UnreadMessagesProvider>
            <SiteAudio />
          </SmoothScrollProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
