import { Button } from '@heroui/react';

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
      <p className="text-red-300">{message}</p>
      {onRetry && (
        <Button className="mt-4" color="danger" variant="flat" onPress={onRetry}>
          重新开始分步生成
        </Button>
      )}
    </div>
  );
}
