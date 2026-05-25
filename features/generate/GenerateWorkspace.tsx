'use client';

import { useCallback, useState } from 'react';
import { Button, Card, CardBody, Input, Tab, Tabs, Textarea } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import type { PipelineRunRequest } from '@/types';
import { PipelineProgress, PipelineOverview } from './PipelineProgress';
import { usePipelineRun } from './usePipelineRun';
import {
  ContentResultView,
  MarketResultView,
  MergeResultView,
  ProductResultView,
  SeoResultView,
  SocialResultView,
} from './ResultDisplay';

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

  const { loading, error, stepStatus, currentStep, steps, result, run } = usePipelineRun();

  const onImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    setImagePreview(b64);
    setImageBase64(b64);
  };

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) return;

    const payload: PipelineRunRequest = {
      description: description.trim(),
      imageBase64,
      options: {
        productName: productName || undefined,
        category: category || undefined,
      },
    };

    await run(payload);
  }, [description, imageBase64, productName, category, run]);

  const showProgress = loading || result != null;
  const hasPartialResults = Object.keys(steps).length > 0;

  return (
    <div className="space-y-8">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,380px)_1fr]">
        <Card className="border border-white/10 bg-gradient-to-b from-white/[0.07] to-transparent shadow-xl shadow-violet-950/20">
          <CardBody className="gap-5 p-6">
            <div>
              <h2 className="text-xl font-semibold text-white">产品输入</h2>
              <p className="mt-1 text-sm text-zinc-500">填写描述并可选上传图片，启动 6 智能体流水线</p>
            </div>
            <Textarea
              label="产品描述"
              placeholder="描述产品功能、材质、适用场景、目标人群…"
              value={description}
              onValueChange={setDescription}
              minRows={4}
              isDisabled={loading}
            />
            <Input
              label="产品名称（可选）"
              value={productName}
              onValueChange={setProductName}
              isDisabled={loading}
            />
            <Input
              label="品类（可选）"
              value={category}
              onValueChange={setCategory}
              isDisabled={loading}
            />
            <div>
              <p className="mb-2 text-sm text-zinc-400">产品图片（可选，支持识图）</p>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-violet-500/30 bg-violet-500/5 px-4 py-6 transition hover:border-violet-400/50 hover:bg-violet-500/10">
                <span className="text-sm text-violet-300">点击上传或拖拽图片</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  className="hidden"
                  disabled={loading}
                />
              </label>
              {imagePreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt="预览"
                  className="mt-3 max-h-44 w-full rounded-xl object-cover ring-1 ring-white/10"
                />
              )}
            </div>
            {!description.trim() && !loading && (
              <p className="text-xs text-amber-400/80">请先填写产品描述</p>
            )}
            <Button
              color="secondary"
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 font-semibold"
              isLoading={loading}
              isDisabled={!description.trim()}
              onPress={handleGenerate}
            >
              {loading ? '智能体协作生成中…' : '一键生成全部内容'}
            </Button>
          </CardBody>
        </Card>

        <div className="space-y-6">
          {showProgress && (
            <PipelineProgress
              stepStatus={stepStatus}
              currentStep={currentStep}
              compact={loading}
            />
          )}

          {!showProgress && !error && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">协作流程预览</h2>
              <PipelineOverview />
            </div>
          )}

          {error && !loading && <ErrorState message={error} onRetry={handleGenerate} />}

          <AnimatePresence mode="wait">
            {hasPartialResults && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <motion.div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">
                    {loading ? '已生成内容' : '营销物料'}
                  </h2>
                  {result && (
                    <span className="text-xs text-zinc-500">
                      {new Date(result.generatedAt).toLocaleString('zh-CN')}
                    </span>
                  )}
                </motion.div>

                <Tabs aria-label="结果分类" color="secondary" variant="underlined">
                  <Tab key="summary" title="汇总">
                    {steps.merged ? (
                      <MergeResultView data={steps.merged} />
                    ) : (
                      <EmptyState message="汇总结果不可用" />
                    )}
                  </Tab>
                  <Tab key="product" title="产品">
                    {steps.productExtract ? (
                      <ProductResultView data={steps.productExtract} />
                    ) : (
                      <EmptyState />
                    )}
                  </Tab>
                  <Tab key="market" title="市场">
                    {steps.marketResearch ? (
                      <MarketResultView data={steps.marketResearch} />
                    ) : (
                      <EmptyState />
                    )}
                  </Tab>
                  <Tab key="content" title="文案">
                    {steps.content ? (
                      <ContentResultView data={steps.content} />
                    ) : (
                      <EmptyState />
                    )}
                  </Tab>
                  <Tab key="seo" title="SEO">
                    {steps.seo ? <SeoResultView data={steps.seo} /> : <EmptyState />}
                  </Tab>
                  <Tab key="social" title="社媒">
                    {steps.social ? (
                      <SocialResultView data={steps.social} />
                    ) : (
                      <EmptyState />
                    )}
                  </Tab>
                </Tabs>
              </motion.div>
            )}

            {loading && !hasPartialResults && (
              <motion.div
                key="loading-hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 text-center text-sm text-violet-200"
              >
                首个步骤完成后将自动展示内容，请耐心等待…
              </motion.div>
            )}

            {!loading && !error && !hasPartialResults && (
              <EmptyState message="填写左侧产品信息并点击生成，即可看到实时流程与结构化结果" />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
