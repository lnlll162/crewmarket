export function EmptyState({ message = '暂无内容' }: { message?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 py-16 text-center text-zinc-500">
      {message}
    </div>
  );
}
