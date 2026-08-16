import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component; safe to ignore
            // when a proxy is refreshing the session in parallel.
          }
        },
      },
    }
  );
}

// auth.getUser() is a real network round-trip to Supabase's Auth server (it
// revalidates the JWT server-side rather than trusting the cookie). The root
// layout and most pages each need the current user, so without memoization
// every one of them pays for that round-trip separately on a single
// navigation. cache() ties the result to the current request, so no matter
// how many server components call this, the round-trip happens once.
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
