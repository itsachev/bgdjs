import Link from "next/link";
import { MessageIcon } from "@/components/icons";

// `href` is precomputed by the caller: either straight to /messages/new
// (which finds-or-creates the conversation and redirects into it) when
// logged in, or through /login?next=... to survive the auth round-trip
// when not.
export function MessageButton({ href, label }) {
  return (
    <Link
      href={href}
      className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-accent transition-colors hover:border-accent hover:text-accent-2"
    >
      <MessageIcon className="h-4 w-4" />
      {label}
    </Link>
  );
}
