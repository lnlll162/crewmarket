export function EmptyState({ message = '暂无结果，先完成左侧输入并开始分步生成' }: { message?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 py-16 text-center text-zinc-500">
      {message}
    </div>
  );
}
