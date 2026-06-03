'use client';

import type { ReactNode } from 'react';
import type {
  ContentGenerateResult,
  MergeResult,
  ModuleResultEnvelope,
  PdfReportDocument,
  PipelineStepId,
  PipelineSummaryOutput,
  TelemetryRecord,
} from '@/types';
import { PLATFORM_LABELS } from './constants';

const MODULE_LABELS: Record<string, string> = {
  productExtract: '产品提取',
  marketResearch: '市场分析',
  content: '文案生成',
  seo: 'SEO 优化',
  social: '社媒改写',
  merged: '汇总评估',
};

const SEVERITY_LABELS: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
};

function formatMs(ms?: number) {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function formatTokens(value?: number) {
  return value == null ? '—' : value.toLocaleString();
}

function formatPercent(rate?: number) {
  if (rate == null || Number.isNaN(rate)) return '—';
  return `${Math.round(rate * 100)}%`;
}

function formatDateTime(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN');
}

function toPdfImageSrc(url: string) {
  if (!url) return url;
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/')) return url;
  if (/^https?:\/\//i.test(url)) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function getImagePreviewUrls(data?: ContentGenerateResult) {
  const urls = [
    ...(data?.imageGeneration?.images?.map((item) => item.url).filter(Boolean) ?? []),
    ...(data?.imageGeneration?.urls?.filter(Boolean) ?? []),
    ...(data?.imageGeneration?.url ? [data.imageGeneration.url] : []),
  ];
  return Array.from(new Set(urls));
}

function resolveExportReportHeading(report: PdfReportDocument, productName?: string) {
  const normalizedName = productName?.trim();
  const shouldReplaceTitle =
    !report.reportTitle ||
    /Pipeline\s*评估报告|运行评估|协同输出/i.test(report.reportTitle);
  const shouldReplaceSubtitle =
    !report.subtitle ||
    /运行评估|协同输出|Pipeline/i.test(report.subtitle);

  return {
    title: shouldReplaceTitle
      ? `CrewMarket${normalizedName ? ` · ${normalizedName}` : ''}营销专业报告`
      : report.reportTitle,
    subtitle: shouldReplaceSubtitle
      ? '产品提取、市场分析、内容生成、SEO 优化与社媒适配综合报告'
      : report.subtitle,
  };
}

function PdfInfoCard({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: ReactNode;
  muted?: boolean;
}) {
  return (
    <div className={`rounded-lg border px-4 py-3 ${muted ? 'border-zinc-200 bg-zinc-50' : 'border-violet-100 bg-violet-50/60'}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <div className="mt-2 text-sm leading-6 text-zinc-800">{value}</div>
    </div>
  );
}

function PdfBulletList({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-sm leading-7 text-zinc-500">暂无。</p>;
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex items-start gap-2 text-sm leading-7 text-zinc-700">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-600" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function PdfSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="break-inside-avoid rounded-xl border border-zinc-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <div className="border-b border-zinc-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-700">CrewMarket Report</p>
        <h2 className="mt-2 text-xl font-semibold text-zinc-900">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p> : null}
      </div>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export function PdfExportDocument({
  report,
  merged,
  summary,
  modules,
  telemetry,
  fallbackProductName,
  id = 'pdf-export-render-area',
}: {
  report: PdfReportDocument;
  merged?: MergeResult;
  summary?: PipelineSummaryOutput;
  modules?: ModuleResultEnvelope[];
  telemetry?: TelemetryRecord[];
  fallbackProductName?: string;
  id?: string;
}) {
  const pkg = merged?.package;
  const snap = report.telemetrySnapshot;
  const perf = summary?.performanceReview;
  const heading = resolveExportReportHeading(
    report,
    pkg?.product?.productName.value || fallbackProductName,
  );
  const totals = {
    durationMs:
      snap?.totalDurationMs ??
      perf?.totalDurationMs ??
      telemetry?.reduce((sum, item) => sum + (item.durationMs ?? 0), 0),
    totalTokens:
      snap?.totalTokens ??
      perf?.totalTokens ??
      telemetry?.reduce((sum, item) => sum + (item.totalTokens ?? 0), 0),
    inputTokens:
      snap?.totalInputTokens ??
      perf?.totalInputTokens ??
      perf?.inputTokens ??
      telemetry?.reduce((sum, item) => sum + (item.inputTokens ?? 0), 0),
    outputTokens:
      snap?.totalOutputTokens ??
      perf?.totalOutputTokens ??
      perf?.outputTokens ??
      telemetry?.reduce((sum, item) => sum + (item.outputTokens ?? 0), 0),
    successRate:
      snap?.successRate ??
      perf?.successRate ??
      (telemetry?.length
        ? telemetry.filter((item) => item.status === 'success').length / telemetry.length
        : undefined),
  };
  const imageUrls = getImagePreviewUrls(pkg?.content);

  return (
    <article
      id={id}
      className="pdf-report-root mx-auto max-w-[210mm] rounded-lg border border-zinc-200 bg-white px-10 py-12 text-zinc-900 shadow-sm"
    >
      <header className="border-b border-zinc-200 pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-700">CrewMarket</p>
        <h1 className="mt-3 text-2xl font-bold leading-tight text-zinc-900">{heading.title}</h1>
        {heading.subtitle ? <p className="mt-2 text-base text-zinc-600">{heading.subtitle}</p> : null}
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-zinc-500">
          {report.pipelineId ? <span>Pipeline · {report.pipelineId}</span> : null}
          <span>生成时间 · {formatDateTime(report.generatedAt)}</span>
          {report.confidence != null ? <span>置信度 · {Math.round(report.confidence * 100)}%</span> : null}
          {report.promptVersion ? <span>版本 · {report.promptVersion}</span> : null}
          {report.modelUsed ? <span>模型 · {report.modelUsed}</span> : null}
        </div>
        {report.coverHighlights?.length ? (
          <ul className="mt-6 space-y-2 rounded-lg bg-violet-50 px-5 py-4">
            {report.coverHighlights.map((item, index) => (
              <li key={`${item}-${index}`} className="text-sm leading-relaxed text-violet-950">
                · {item}
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      <div className="mt-8 space-y-8">
        {pkg?.product ? (
          <PdfSection title="产品提取结果" description="保留结构化产品识别字段，便于直接用于后续营销内容和报告复盘。">
            <div className="grid gap-4 sm:grid-cols-2">
              <PdfInfoCard label="产品名称" value={pkg.product.productName.value || '—'} />
              <PdfInfoCard label="品类识别" value={pkg.product.category.value || '—'} />
              <PdfInfoCard label="产品属性" value={<PdfBulletList items={pkg.product.attributes.value ?? []} />} muted />
              <PdfInfoCard label="核心卖点" value={<PdfBulletList items={pkg.product.sellingPoints.value ?? []} />} muted />
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">产品摘要</p>
              <p className="mt-3 text-sm leading-7 text-zinc-700">{pkg.product.summary || '暂无。'}</p>
            </div>
          </PdfSection>
        ) : null}

        {pkg?.market ? (
          <PdfSection title="市场分析结果" description="汇总市场趋势、竞品风格与目标受众判断，直接服务后续内容产出。">
            <div className="grid gap-4 sm:grid-cols-2">
              <PdfInfoCard label="市场趋势" value={pkg.market.marketTrends || '—'} />
              <PdfInfoCard label="竞品风格" value={pkg.market.competitorStyle || '—'} />
              <PdfInfoCard label="用户画像" value={pkg.market.userPersona || '—'} muted />
              <PdfInfoCard label="品牌调性" value={pkg.market.brandTone || '—'} muted />
            </div>
            <PdfInfoCard label="视觉风格" value={pkg.market.visualStyle || '—'} muted />
            <div>
              <p className="text-sm font-semibold text-zinc-900">营销建议</p>
              <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-4">
                <PdfBulletList items={pkg.market.marketingSuggestions ?? []} />
              </div>
            </div>
          </PdfSection>
        ) : null}

        {pkg?.content ? (
          <PdfSection title="内容生成结果" description="按正式报告样式输出主标题、卖点文案、图像结果与视频素材建议。">
            <PdfInfoCard label="内容总标题" value={pkg.content.title || '—'} />
            <div>
              <p className="text-sm font-semibold text-zinc-900">卖点文案</p>
              <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-4">
                <PdfBulletList items={pkg.content.sellingPointCopy ?? []} />
              </div>
            </div>
            {imageUrls.length ? (
              <div>
                <p className="text-sm font-semibold text-zinc-900">内容图片</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {imageUrls.slice(0, 4).map((url, index) => (
                    <div key={`${url}-${index}`} className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={toPdfImageSrc(url)}
                        alt={`内容生成图片 ${index + 1}`}
                        className="h-auto max-h-[320px] w-full rounded-md object-contain"
                        crossOrigin="anonymous"
                        loading="eager"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <PdfInfoCard label="详情页内容" value={pkg.content.detailPageContent || '—'} muted />
              <PdfInfoCard label="转化描述" value={pkg.content.conversionDescription || '—'} muted />
            </div>
            <PdfInfoCard label="视频脚本" value={pkg.content.videoScript || '—'} muted />
            {(pkg.content.posterCopy?.headline || pkg.content.posterCopy?.subheadline || pkg.content.posterCopy?.slogan) ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <PdfInfoCard label="海报标题" value={pkg.content.posterCopy?.headline || '—'} />
                <PdfInfoCard label="海报副标题" value={pkg.content.posterCopy?.subheadline || '—'} muted />
                <PdfInfoCard label="海报口号" value={pkg.content.posterCopy?.slogan || '—'} muted />
              </div>
            ) : null}
            {pkg.content.imageIdeas?.length ? (
              <div>
                <p className="text-sm font-semibold text-zinc-900">图片创意说明</p>
                <div className="mt-3 space-y-3">
                  {pkg.content.imageIdeas.map((item, index) => (
                    <div key={`${item.title}-${index}`} className="rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-4">
                      <p className="text-sm font-medium text-zinc-900">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-zinc-700">{item.description}</p>
                      <p className="mt-2 text-xs uppercase tracking-wide text-zinc-500">适用场景 · {item.usage}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {pkg.content.videoMaterial ? (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-4">
                <p className="text-sm font-semibold text-zinc-900">视频素材建议</p>
                <p className="mt-3 text-sm leading-7 text-zinc-700">钩子：{pkg.content.videoMaterial.hook}</p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">口播：{pkg.content.videoMaterial.voiceover}</p>
                <p className="mt-2 text-sm leading-7 text-zinc-700">字幕：{pkg.content.videoMaterial.caption}</p>
                <div className="mt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">分镜</p>
                  <div className="mt-2">
                    <PdfBulletList items={pkg.content.videoMaterial.scenes} />
                  </div>
                </div>
              </div>
            ) : null}
          </PdfSection>
        ) : null}

        {pkg?.seo ? (
          <PdfSection title="SEO 优化结果" description="保留关键词、优化标题和渠道适配文案，便于落地投放与搜索承接。">
            <PdfInfoCard label="关键词" value={<PdfBulletList items={pkg.seo.keywords ?? []} />} />
            <PdfInfoCard label="优化标题" value={pkg.seo.optimizedTitle || '—'} muted />
            <PdfInfoCard label="搜索友好文案" value={pkg.seo.searchFriendlyCopy || '—'} muted />
            <div className="grid gap-4 sm:grid-cols-3">
              <PdfInfoCard label="小红书适配" value={pkg.seo.channelAdaptation?.xiaohongshu || '—'} />
              <PdfInfoCard label="微博适配" value={pkg.seo.channelAdaptation?.weibo || '—'} muted />
              <PdfInfoCard label="抖音适配" value={pkg.seo.channelAdaptation?.douyin || '—'} muted />
            </div>
          </PdfSection>
        ) : null}

        {pkg?.social ? (
          <PdfSection title="社媒适配结果" description="保留各平台成稿与标签，方便直接投放或二次编辑。">
            <div className="space-y-4">
              {pkg.social.copies.map((copy, index) => (
                <div key={`${copy.platform}-${index}`} className="rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-4">
                  <p className="text-sm font-semibold text-zinc-900">{PLATFORM_LABELS[copy.platform] ?? copy.platform}</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-700">{copy.content}</p>
                  <p className="mt-3 text-xs leading-6 text-zinc-500">
                    {copy.hashtags.map((tag) => `#${tag.replace(/^#/, '')}`).join(' ')}
                  </p>
                </div>
              ))}
            </div>
            {pkg.social.scriptSuggestion ? (
              <PdfInfoCard label="短视频脚本建议" value={pkg.social.scriptSuggestion} muted />
            ) : null}
          </PdfSection>
        ) : null}

        <PdfSection title="运行统计与过程记录" description="将运行统计快照、模块过程记录与关键执行元数据统一附在报告后段。">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <PdfInfoCard label="总耗时" value={formatMs(totals.durationMs)} />
            <PdfInfoCard label="总 Token" value={formatTokens(totals.totalTokens)} muted />
            <PdfInfoCard label="输入 Token" value={formatTokens(totals.inputTokens)} muted />
            <PdfInfoCard label="输出 Token" value={formatTokens(totals.outputTokens)} muted />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <PdfInfoCard label="成功率" value={formatPercent(totals.successRate)} />
            <PdfInfoCard label="运行摘要" value={snap?.summaryText || perf?.summary || '暂无。'} muted />
          </div>
          {modules?.length ? (
            <div>
              <p className="text-sm font-semibold text-zinc-900">模块过程记录</p>
              <div className="mt-3 space-y-3">
                {modules.map((item, index) => (
                  <div key={`${item.moduleId}-${item.startedAt ?? index}`} className="rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">{MODULE_LABELS[item.moduleId] ?? item.moduleName}</p>
                        <p className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
                          {item.roleName} · {item.roleId}
                          {item.promptVersion ? ` · ${item.promptVersion}` : ''}
                        </p>
                      </div>
                      <div className="text-right text-xs leading-6 text-zinc-500">
                        <p>状态：{item.status}</p>
                        <p>耗时：{formatMs(item.durationMs)}</p>
                        <p>Token：{formatTokens(item.totalTokens)}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <PdfInfoCard label="输入摘要" value={item.inputSummary || '—'} muted />
                      <PdfInfoCard label="输出摘要" value={item.outputSummary || '—'} muted />
                    </div>
                    {item.errorMessage ? <p className="mt-3 text-sm leading-7 text-rose-600">错误：{item.errorMessage}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {telemetry?.length ? (
            <div>
              <p className="text-sm font-semibold text-zinc-900">角色调用记录</p>
              <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200">
                <div className="grid grid-cols-[1.2fr_1fr_0.7fr_0.7fr_0.7fr_0.8fr] gap-2 bg-zinc-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  <span>角色 / 模块</span>
                  <span>模型</span>
                  <span>耗时</span>
                  <span>输入</span>
                  <span>输出</span>
                  <span>状态</span>
                </div>
                <div className="divide-y divide-zinc-200">
                  {telemetry.map((item, index) => (
                    <div key={`${item.moduleId}-${item.startedAt}-${index}`} className="grid grid-cols-[1.2fr_1fr_0.7fr_0.7fr_0.7fr_0.8fr] gap-2 px-4 py-3 text-xs leading-6 text-zinc-700">
                      <div>
                        <p className="font-medium text-zinc-900">{item.roleName}</p>
                        <p className="text-zinc-500">{MODULE_LABELS[item.moduleId] ?? item.moduleId}</p>
                      </div>
                      <p className="break-words">{item.model || '—'}</p>
                      <p>{formatMs(item.durationMs)}</p>
                      <p>{formatTokens(item.inputTokens)}</p>
                      <p>{formatTokens(item.outputTokens)}</p>
                      <p>{item.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </PdfSection>

        <PdfSection title="评估报告附录" description="将评估摘要、风险机会判断与专业报告章节附在报告尾部，保持统一版式输出。">
          {summary?.executiveSummary ? (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Executive Summary</p>
              <p className="mt-3 text-sm leading-7 text-zinc-700">{summary.executiveSummary}</p>
            </div>
          ) : null}
          {summary?.riskAssessment?.length ? (
            <div>
              <p className="text-sm font-semibold text-zinc-900">风险预测</p>
              <div className="mt-3 space-y-3">
                {summary.riskAssessment.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-4">
                    <p className="text-sm font-medium text-zinc-900">{item.title}</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-700">{item.detail}</p>
                    <p className="mt-2 text-xs uppercase tracking-wide text-zinc-500">风险等级 · {SEVERITY_LABELS[item.severity] ?? item.severity}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {summary?.opportunityAnalysis?.length ? (
            <div>
              <p className="text-sm font-semibold text-zinc-900">机会分析</p>
              <div className="mt-3 space-y-3">
                {summary.opportunityAnalysis.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-4">
                    <p className="text-sm font-medium text-zinc-900">{item.title}</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-700">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {summary?.recommendations?.length ? (
            <div>
              <p className="text-sm font-semibold text-zinc-900">行动建议</p>
              <div className="mt-3 space-y-3">
                {summary.recommendations.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-4">
                    <p className="text-sm font-medium text-zinc-900">{item.title}</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-700">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {summary?.roleEvaluation?.length ? (
            <div>
              <p className="text-sm font-semibold text-zinc-900">角色评估</p>
              <div className="mt-3 space-y-3">
                {summary.roleEvaluation.map((item) => (
                  <div key={item.roleId} className="rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-zinc-900">{item.roleName}</p>
                      {typeof item.score === 'number' ? (
                        <span className="text-xs uppercase tracking-wide text-zinc-500">评分 · {item.score}</span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-zinc-700">{item.evaluation}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="space-y-5">
            {report.sections.map((section, index) => (
              <div key={`${section.id}-${index}`} className="rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-4">
                <h3 className="text-base font-semibold text-zinc-900">{section.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-700">{section.content}</p>
                {section.bullets?.length ? (
                  <div className="mt-3">
                    <PdfBulletList items={section.bullets} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </PdfSection>
      </div>

      {report.disclaimer ? (
        <footer className="mt-10 border-t border-zinc-200 pt-6 text-xs leading-relaxed text-zinc-500">
          {report.disclaimer}
        </footer>
      ) : null}
    </article>
  );
}
