import { Spinner } from '@heroui/react';

export function LoadingState({ label = '生成中…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-400">
      <Spinner color="secondary" />
      <p>{label}</p>
    </div>
  );
}
