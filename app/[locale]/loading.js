export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center py-32">
      <div
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent"
      />
    </div>
  );
}
