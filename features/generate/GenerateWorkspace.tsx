'use client';

import { useCallback, useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  Input,
  Tab,
  Tabs,
  Textarea,
} from '@heroui/react';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ApiResponse, PipelineRunRequest, PipelineRunResponseData } from '@/types';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function GenerateWorkspace() {
  const [description, setDescription] = useState('');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PipelineRunResponseData | null>(null);

  const onImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setImagePreview(b64);
    setImageBase64(b64);
  };

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) {
      setError('请填写产品描述');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const payload: PipelineRunRequest = {
      description: description.trim(),
      imageBase64,
      options: {
        productName: productName || undefined,
        category: category || undefined,
      },
    };

    try {
      const res = await fetch('/api/pipeline/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as ApiResponse<PipelineRunResponseData>;
      if (json.code !== 0 || !json.data) {
        throw new Error(json.message || '生成失败');
      }
      setResult(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setLoading(false);
    }
  }, [description, imageBase64, productName, category]);

  const exportJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crewmarket-${result.pipelineId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card className="border border-white/10 bg-white/5">
        <CardBody className="gap-4 p-6">
          <h2 className="text-xl font-semibold text-white">产品输入</h2>
          <Textarea
            label="产品描述"
            placeholder="描述产品功能、材质、适用场景…"
            value={description}
            onValueChange={setDescription}
            minRows={4}
          />
          <Input label="产品名称（可选）" value={productName} onValueChange={setProductName} />
          <Input label="品类（可选）" value={category} onValueChange={setCategory} />
          <div>
            <p className="mb-2 text-sm text-zinc-400">产品图片（可选，支持识图）</p>
            <input type="file" accept="image/*" onChange={onImageChange} className="text-sm text-zinc-300" />
            {imagePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} alt="预览" className="mt-3 max-h-40 rounded-lg object-cover" />
            )}
          </div>
          <Button color="secondary" size="lg" isLoading={loading} onPress={handleGenerate}>
            一键生成全部内容
          </Button>
        </CardBody>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">生成结果</h2>
        {loading && <LoadingState label="CrewAI 多智能体生成中，请稍候…" />}
        {error && !loading && <ErrorState message={error} onRetry={handleGenerate} />}
        {!loading && !error && !result && <EmptyState message="填写产品信息并点击生成" />}
        {result && !loading && (
          <>
            <div className="flex gap-2">
              <Button size="sm" variant="flat" onPress={exportJson}>
                导出 JSON
              </Button>
              <Button
                size="sm"
                variant="flat"
                onPress={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}
              >
                复制 JSON
              </Button>
            </div>
            <Tabs aria-label="结果预览">
              <Tab key="content" title="文案">
                <pre className="max-h-96 overflow-auto rounded-xl bg-black/40 p-4 text-xs text-zinc-300">
                  {JSON.stringify(result.steps.content, null, 2)}
                </pre>
              </Tab>
              <Tab key="seo" title="SEO">
                <pre className="max-h-96 overflow-auto rounded-xl bg-black/40 p-4 text-xs text-zinc-300">
                  {JSON.stringify(result.steps.seo, null, 2)}
                </pre>
              </Tab>
              <Tab key="social" title="社媒">
                <pre className="max-h-96 overflow-auto rounded-xl bg-black/40 p-4 text-xs text-zinc-300">
                  {JSON.stringify(result.steps.social, null, 2)}
                </pre>
              </Tab>
              <Tab key="all" title="完整">
                <pre className="max-h-96 overflow-auto rounded-xl bg-black/40 p-4 text-xs text-zinc-300">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </Tab>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
