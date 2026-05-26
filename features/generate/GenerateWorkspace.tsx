'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { loading, error, stepStatus, currentStep, steps, result, run } = usePipelineRun();

  const onImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    const b64 = await fileToBase64(file);
    setImagePreview(objectUrl);
    setImageBase64(b64);
  };

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

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
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    if (hasPartialResults) setActiveTab('summary');
  }, [hasPartialResults]);

  return (
    <div className="space-y-8">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)] xl:items-start">
        <Card className="border border-white/10 bg-gradient-to-b from-white/[0.07] to-transparent shadow-xl shadow-violet-950/20 xl:sticky xl:top-6">
          <CardBody className="gap-5 p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300/90">CREWAI · 多智能体</p>
              <h2 className="mt-2 text-xl font-semibold text-white">产品输入</h2>
              <p className="mt-1 text-sm text-zinc-500">填写描述并可选上传图片，按步骤串行启动生成流程</p>
            </div>
            <Textarea
              label="产品描述"
              placeholder="描述产品功能、材质、适用场景、目标人群…"
              value={description}
              onValueChange={setDescription}
              minRows={6}
              classNames={{
                inputWrapper:
                  'min-h-[148px] rounded-2xl border border-white/10 bg-black/30 px-4 py-3 shadow-inner shadow-black/20 transition focus-within:border-violet-500/50 focus-within:ring-2 focus-within:ring-violet-500/20',
                label: 'text-zinc-200 text-sm font-medium',
                input: 'text-white placeholder:text-zinc-500',
              }}
              isDisabled={loading}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="产品名称（可选）"
                value={productName}
                onValueChange={setProductName}
                isDisabled={loading}
                classNames={{
                  inputWrapper:
                    'rounded-2xl border border-white/10 bg-black/30 px-4 shadow-inner shadow-black/20 transition focus-within:border-violet-500/50 focus-within:ring-2 focus-within:ring-violet-500/20',
                  label: 'text-zinc-200 text-sm font-medium',
                  input: 'text-white placeholder:text-zinc-500',
                }}
              />
              <Input
                label="品类（可选）"
                value={category}
                onValueChange={setCategory}
                isDisabled={loading}
                classNames={{
                  inputWrapper:
                    'rounded-2xl border border-white/10 bg-black/30 px-4 shadow-inner shadow-black/20 transition focus-within:border-violet-500/50 focus-within:ring-2 focus-within:ring-violet-500/20',
                  label: 'text-zinc-200 text-sm font-medium',
                  input: 'text-white placeholder:text-zinc-500',
                }}
              />
            </div>
            <div>
              <p className="mb-2 text-sm text-zinc-400">产品图片（可选，支持识图）</p>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-3 shadow-inner shadow-black/20">
                <div className="grid gap-3 sm:grid-cols-[128px_minmax(0,1fr)]">
                  <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
                    {imagePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imagePreview} alt="产品图片预览" className="h-full w-full object-contain" />
                    ) : (
                      <span className="px-4 text-center text-xs text-zinc-500">暂无图片</span>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col justify-center gap-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        {imagePreview ? '图片已选择' : '上传产品图片'}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                        支持 JPG、PNG、WEBP。图片会用于识别产品外观、材质和使用场景。
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="flat"
                        color="secondary"
                        onPress={() => {
                          if (!fileInputRef.current) return;
                          fileInputRef.current.value = '';
                          fileInputRef.current.click();
                        }}
                        isDisabled={loading}
                      >
                        {imagePreview ? '重新上传图片' : '选择图片'}
                      </Button>
                      {imagePreview && (
                        <Button
                          type="button"
                          size="sm"
                          variant="light"
                          onPress={() => {
                            setImagePreview(null);
                            setImageBase64(undefined);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          isDisabled={loading}
                        >
                          移除
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  id="product-image-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/*"
                  onChange={onImageChange}
                  className="sr-only"
                  disabled={loading}
                />
              </div>
            </div>
            {!description.trim() && !loading && (
              <p className="text-xs text-amber-400/80">请先填写产品描述</p>
            )}
            <Button
              color="secondary"
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 font-semibold shadow-lg shadow-violet-950/30"
              isLoading={loading}
              isDisabled={!description.trim()}
              onPress={handleGenerate}
            >
              {loading ? '分步生成中…' : '开始分步生成'}
            </Button>
          </CardBody>
        </Card>

        <div className="min-w-0 space-y-6 overflow-hidden">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)]">
            <div className="min-w-0 space-y-6 overflow-hidden">
              {showProgress && (
                <PipelineProgress
                  stepStatus={stepStatus}
                  currentStep={currentStep}
                  compact={loading}
                />
              )}

              {!showProgress && !error && <PipelineOverview />}
            </div>
          </div>

          {error && !loading && <ErrorState message={error} onRetry={handleGenerate} />}

          <AnimatePresence mode="wait">
            {hasPartialResults && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="min-w-0 space-y-4 overflow-hidden"
              >
                <Tabs
                  aria-label="生成结果分类"
                  color="secondary"
                  variant="underlined"
                  selectedKey={activeTab}
                  onSelectionChange={(key) => setActiveTab(String(key))}
                  classNames={{
                    tabList: 'flex-wrap gap-2',
                    panel: 'mt-4',
                  }}
                >
                  <Tab key="summary" title="总览">
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
                  <Tab key="merge" title="汇总">
                    {steps.merged ? (
                      <MergeResultView data={steps.merged} />
                    ) : (
                      <EmptyState message="汇总结果不可用" />
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
