export function SiteFooter({ dict }) {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-6 text-center text-sm text-foreground-muted">
        <p className="font-display text-foreground">
          BG<span className="text-accent">DJ</span>
        </p>
        <p>{dict.footer.tagline}</p>
        <p>&copy; {new Date().getFullYear()} Bulgarian DJ Community. {dict.footer.rights}</p>
      </div>
    </footer>
  );
}
