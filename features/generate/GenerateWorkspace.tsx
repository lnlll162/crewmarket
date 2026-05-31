'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, CardBody, Tab, Tabs } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import type { PipelineRunRequest, PipelineStepId, ProductInputAsset } from '@/types';
import { PipelineProgress, PipelineOverview } from './PipelineProgress';
import { usePipelineRun } from './usePipelineRun';
import {
  ContentResultView,
  MarketResultView,
  MergeResultView,
  ModuleProcessView,
  ProductResultView,
  SeoResultView,
  SocialResultView,
  SummaryReportView,
  TelemetrySummaryView,
  PdfReportView,
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
  const [audience, setAudience] = useState('');
  const [brandStyle, setBrandStyle] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [competitorInfo, setCompetitorInfo] = useState('');
  const [marketingGoal, setMarketingGoal] = useState('');
  const [textAssets, setTextAssets] = useState<Array<{ id: string; label: string; content: string }>>([
    { id: 'asset-product', label: '产品资料', content: '' },
    { id: 'asset-competitor', label: '竞品信息', content: '' },
    { id: 'asset-brand', label: '品牌要求', content: '' },
  ]);
  const [imageAssets, setImageAssets] = useState<Array<{ id: string; label: string; preview: string | null; base64?: string }>>([
    { id: 'image-1', label: '主图', preview: null },
    { id: 'image-2', label: '参考图', preview: null },
  ]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { loading, error, stepStatus, currentStep, steps, result, run } = usePipelineRun();

  const onImageChange = async (assetId: string, file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const b64 = await fileToBase64(file);
    setImageAssets((prev) =>
      prev.map((asset) => (asset.id === assetId ? { ...asset, preview: objectUrl, base64: b64 } : asset)),
    );
  };

  useEffect(() => {
    return () => {
      imageAssets.forEach((asset) => {
        if (asset.preview?.startsWith('blob:')) URL.revokeObjectURL(asset.preview);
      });
    };
  }, [imageAssets]);

  const handleGenerate = useCallback(async () => {
    const payload: PipelineRunRequest = {
      description: description.trim() || undefined,
      imageBase64: imageAssets[0]?.base64,
      assets: [
        ...textAssets
          .filter((asset) => asset.content.trim().length > 0)
          .map<ProductInputAsset>((asset) => ({
            id: asset.id,
            type: 'text',
            label: asset.label,
            content: asset.content.trim(),
          })),
        ...imageAssets
          .filter((asset) => asset.base64 || asset.preview)
          .map<ProductInputAsset>((asset) => ({
            id: asset.id,
            type: 'image',
            label: asset.label,
            base64: asset.base64,
            url: asset.preview ?? undefined,
          })),
      ],
      options: {
        productName: productName || undefined,
        category: category || undefined,
        targetAudience: audience || undefined,
        brandStyle: brandStyle || undefined,
        priceRange: priceRange || undefined,
        competitorInfo: competitorInfo || undefined,
        marketingGoal: marketingGoal || undefined,
      },
    };

    await run(payload);
  }, [
    description,
    imageAssets,
    textAssets,
    productName,
    category,
    audience,
    brandStyle,
    priceRange,
    competitorInfo,
    marketingGoal,
    run,
  ]);

  const handleExportPdf = useCallback(() => {
    const pdfArea = document.getElementById('pdf-report-print-area');
    const fallbackArea = document.getElementById('pipeline-result-print-area');
    const source = pdfArea ?? fallbackArea;
    if (!source) return;

    const popup = window.open('', '_blank', 'noopener,noreferrer,width=1400,height=1000');
    if (!popup) return;

    const cloned = source.cloneNode(true) as HTMLElement;
    cloned.classList.add('print-root');
    const isPdfReport = Boolean(pdfArea);

    popup.document.documentElement.innerHTML = `
      <head>
        <title>CrewMarket ${isPdfReport ? '评估报告' : '结果导出'}</title>
        <meta charset="utf-8" />
        <style>
          :root { color-scheme: ${isPdfReport ? 'light' : 'dark'}; }
          body {
            margin: 0;
            background: ${isPdfReport ? '#f4f4f5' : '#09090f'};
            color: ${isPdfReport ? '#18181b' : '#f4f4f5'};
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          .print-root {
            padding: ${isPdfReport ? '24px' : '32px'};
            background: ${isPdfReport ? '#ffffff' : 'linear-gradient(180deg, rgba(24,24,27,1) 0%, rgba(9,9,15,1) 100%)'};
            max-width: ${isPdfReport ? '210mm' : 'none'};
            margin: ${isPdfReport ? '0 auto' : '0'};
          }
          .print-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-root img { max-width: 100%; page-break-inside: avoid; }
          .print-root section, .print-root header, .print-root footer { page-break-inside: avoid; }
          @page { size: A4; margin: 16mm; }
        </style>
      </head>
      <body></body>
    `;
    popup.document.body.appendChild(cloned);
    popup.focus();
    setTimeout(() => popup.print(), 300);
  }, []);

  const showProgress = loading || result != null;
  const hasPartialResults = Object.keys(steps).length > 0;
  const [activeTab, setActiveTab] = useState('summary');
  const [visibleSteps, setVisibleSteps] = useState<Partial<Record<PipelineStepId, boolean>>>({});

  useEffect(() => {
    if (!hasPartialResults) {
      setVisibleSteps({});
      return;
    }

    const order: PipelineStepId[] = ['productExtract', 'marketResearch', 'content', 'seo', 'social', 'merged'];
    const nextVisible: Partial<Record<PipelineStepId, boolean>> = {};
    for (const step of order) {
      if (steps[step]) nextVisible[step] = true;
    }
    setVisibleSteps(nextVisible);
    setActiveTab('summary');
  }, [hasPartialResults, steps]);

  return (
    <div className="relative overflow-hidden text-zinc-100">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(168,85,247,0.14),transparent_26%),radial-gradient(circle_at_80%_0%,rgba(236,72,153,0.08),transparent_22%),radial-gradient(circle_at_70%_70%,rgba(139,92,246,0.08),transparent_28%)]" />
      <div className="space-y-8">
        <section className="rounded-[24px] bg-[linear-gradient(180deg,rgba(27,27,40,0.92),rgba(12,12,18,0.96))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-2xl transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_64px_rgba(0,0,0,0.3)]">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-violet-300">CREWAI · 多智能体</p>
            <h2 className="text-3xl font-semibold tracking-tight text-white">产品输入与生成控制台</h2>
          </div>
        </section>

        <Card className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,rgba(29,24,50,0.94),rgba(12,12,18,0.98))] shadow-[0_28px_90px_rgba(0,0,0,0.34)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_34px_110px_rgba(0,0,0,0.42)]">
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.05),transparent_28%)]" />
          <div className="pointer-events-none absolute -right-10 top-12 h-32 w-32 rounded-full bg-violet-500/18 blur-3xl" />
          <CardBody className="relative gap-5 p-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-200/90">输入区</p>
              <h3 className="text-2xl font-semibold text-white">产品信息</h3>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)] xl:items-start">
              <div className="space-y-2">
                <label htmlFor="product-description" className="text-sm font-medium text-zinc-100">
                  产品描述
                </label>
                <textarea
                  id="product-description"
                  placeholder="描述产品功能、材质、适用场景、目标人群…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={10}
                  disabled={loading}
                  className="min-w-0 w-full rounded-2xl bg-white/[0.04] px-4 py-3 text-white shadow-inner shadow-black/15 transition outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-violet-400/20 disabled:cursor-not-allowed disabled:opacity-60 resize-y leading-relaxed whitespace-pre-wrap break-words overflow-y-auto"
                />
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="space-y-2">
                    <label htmlFor="product-name" className="text-sm font-medium text-zinc-200">
                      产品名称（可选）
                    </label>
                    <input
                      id="product-name"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      disabled={loading}
                      placeholder="例如：便携式搅拌杯"
                      className="min-w-0 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white shadow-inner shadow-black/15 transition outline-none placeholder:text-zinc-500 focus:border-violet-400/70 focus:ring-2 focus:ring-violet-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="category" className="text-sm font-medium text-zinc-200">
                      品类（可选）
                    </label>
                    <input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={loading}
                      placeholder="例如：厨房家电"
                      className="min-w-0 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white shadow-inner shadow-black/15 transition outline-none placeholder:text-zinc-500 focus:border-violet-400/70 focus:ring-2 focus:ring-violet-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm text-zinc-400">产品图片（可选，支持识图）</p>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 shadow-inner shadow-black/15">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] sm:w-32">
                        {imageAssets[0]?.preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={imageAssets[0].preview} alt="产品图片预览" className="h-full w-full object-contain" />
                        ) : (
                          <span className="px-4 text-center text-xs text-zinc-500">暂无图片</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-3">
                        <div>
                          <p className="text-sm font-medium text-zinc-100">
                            {imageAssets[0]?.preview ? '图片已选择' : '上传产品图片'}
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
                            {imageAssets[0]?.preview ? '重新上传图片' : '选择图片'}
                          </Button>
                          {imageAssets[0]?.preview && (
                            <Button
                              type="button"
                              size="sm"
                              variant="light"
                              onPress={() => {
                                setImageAssets((prev) => prev.map((asset, index) => (index === 0 ? { ...asset, preview: null, base64: undefined } : asset)));
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
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        await onImageChange(imageAssets[0]?.id ?? 'image-1', file);
                      }}
                      className="sr-only"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4 md:flex-row md:items-center md:justify-between">
              <Button
                color="secondary"
                size="lg"
                className="bg-violet-600 font-semibold text-white shadow-lg shadow-violet-950/25 ring-1 ring-violet-300/20 transition hover:bg-violet-500 md:min-w-[220px]"
                isLoading={loading}
                isDisabled={!description.trim()}
                onPress={handleGenerate}
              >
                {loading ? '分步生成中…' : '开始分步生成'}
              </Button>
            </div>
          </CardBody>
        </Card>

        <section className="rounded-[28px] bg-[linear-gradient(180deg,rgba(22,26,42,0.94),rgba(10,10,16,0.98))] p-6 shadow-[0_28px_86px_rgba(0,0,0,0.36)] backdrop-blur-2xl transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_34px_96px_rgba(0,0,0,0.42)]">
          <div className="flex items-center justify-between gap-4 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-200/90">流程区</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">生成进度</h3>
            </div>
            {showProgress && (
              <Button size="sm" variant="flat" color="secondary" onPress={handleExportPdf} className="border border-violet-400/18 bg-white/5 text-violet-100 transition hover:border-violet-300/35 hover:bg-violet-500/15 hover:text-white">
                导出 PDF
              </Button>
            )}
          </div>
          <div className="mt-6 min-w-0 space-y-6 overflow-hidden">
            {showProgress && (
              <PipelineProgress
                stepStatus={stepStatus}
                currentStep={currentStep}
                compact={loading}
              />
            )}

            {!showProgress && !error && <PipelineOverview />}
          </div>
        </section>

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
              <section className="rounded-[28px] bg-[linear-gradient(180deg,rgba(20,20,32,0.94),rgba(10,10,16,0.98))] p-6 shadow-[0_28px_86px_rgba(0,0,0,0.36)] backdrop-blur-2xl transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_34px_96px_rgba(0,0,0,0.42)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-200/90">结果区</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">分步展示结果</h3>
                  </div>
                </div>
                <div id="pipeline-result-print-area" className="mt-6 space-y-4">
                  <Tabs
                    aria-label="生成结果分类"
                    color="secondary"
                    variant="underlined"
                    selectedKey={activeTab}
                    onSelectionChange={(key) => setActiveTab(String(key))}
                    classNames={{
                      tabList: 'flex-wrap gap-2',
                      panel: 'mt-4',
                      cursor: 'bg-violet-500',
                      tabContent: 'group-data-[selected=true]:text-violet-100 group-data-[hover=true]:text-white transition-colors',
                      tab: 'transition-transform duration-200 hover:-translate-y-0.5',
                    }}
                  >
                    <Tab key="summary" title="总览">
                      {steps.merged ? (
                        <MergeResultView data={steps.merged} />
                      ) : (
                        <EmptyState message="汇总结果不可用" />
                      )}
                    </Tab>
                    <Tab key="telemetry" title="运行统计">
                      <TelemetrySummaryView telemetry={result?.telemetry} summary={result?.summary} />
                    </Tab>
                    <Tab key="process" title="过程记录">
                      <ModuleProcessView modules={result?.modules} />
                    </Tab>
                    <Tab key="report" title="评估报告">
                      <SummaryReportView summary={result?.summary} />
                      {result?.pdfReport ? (
                        <div className="mt-8 space-y-3">
                          <p className="text-sm text-zinc-400">
                            下方为 PDF 专业报告预览（由独立报告模型基于 summary 生成，点击「导出 PDF」将优先导出此版式）
                          </p>
                          <PdfReportView report={result.pdfReport} />
                        </div>
                      ) : null}
                    </Tab>
                    <Tab key="pipeline" title="流程字段">
                      <div className="space-y-3 rounded-[20px] bg-black/20 p-4 text-sm text-zinc-300 ring-1 ring-inset ring-white/5">
                        <p>上方输入字段：产品描述、产品名称、品类、图片</p>
                        <p>实际生成字段：产品提取、市场分析、内容文案、SEO、社媒、汇总</p>
                        <p className="text-zinc-500">说明：输入字段是触发条件，生成字段是模型输出结果，两者本来就不一样。</p>
                      </div>
                    </Tab>
                    <Tab key="product" title={visibleSteps.productExtract ? '产品' : '产品 · 等待'}>
                      {steps.productExtract ? (
                        <ProductResultView data={steps.productExtract} />
                      ) : (
                        <EmptyState />
                      )}
                    </Tab>
                    <Tab key="market" title={visibleSteps.marketResearch ? '市场' : '市场 · 等待'}>
                      {steps.marketResearch ? (
                        <MarketResultView data={steps.marketResearch} />
                      ) : (
                        <EmptyState />
                      )}
                    </Tab>
                    <Tab key="content" title={visibleSteps.content ? '文案' : '文案 · 等待'}>
                      {steps.content ? (
                        <ContentResultView data={steps.content} />
                      ) : (
                        <EmptyState />
                      )}
                    </Tab>
                    <Tab key="seo" title={visibleSteps.seo ? 'SEO' : 'SEO · 等待'}>
                      {steps.seo ? <SeoResultView data={steps.seo} /> : <EmptyState />}
                    </Tab>
                    <Tab key="social" title={visibleSteps.social ? '社媒' : '社媒 · 等待'}>
                      {steps.social ? (
                        <SocialResultView data={steps.social} />
                      ) : (
                        <EmptyState />
                      )}
                    </Tab>
                    <Tab key="merge" title={visibleSteps.merged ? '汇总' : '汇总 · 等待'}>
                      {steps.merged ? (
                        <MergeResultView data={steps.merged} />
                      ) : (
                        <EmptyState message="汇总结果不可用" />
                      )}
                    </Tab>
                  </Tabs>
                </div>
              </section>
            </motion.div>
          )}

          {loading && !hasPartialResults && (
            <motion.div
              key="loading-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-[22px] bg-white/[0.06] px-4 py-3 text-center text-sm text-violet-100 shadow-[0_20px_50px_rgba(0,0,0,0.26)]"
            >
            </motion.div>
          )}

          {!loading && !error && !hasPartialResults && (
            <EmptyState message="" />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
