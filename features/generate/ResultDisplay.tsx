'use client';

import { Button, Chip, Divider } from '@heroui/react';
import type { ReactNode } from 'react';
import type {
  ContentGenerateResult,
  FieldWithStatus,
  MarketResearchResult,
  MergeResult,
  ProductExtractResult,
  SeoOptimizeResult,
  SocialGenerateResult,
} from '@/types';
import { PLATFORM_LABELS } from './constants';

function copyText(text: string) {
  void navigator.clipboard.writeText(text);
}

function StatusBadge({ status, note }: { status: FieldWithStatus['status']; note?: string }) {
  return (
    <Chip
      size="sm"
      variant="flat"
      color={status === 'confirmed' ? 'success' : 'warning'}
      className="ml-2 bg-white/[0.06]"
    >
      {status === 'confirmed' ? '已确认' : '待确认'}
      {note ? ` · ${note}` : ''}
    </Chip>
  );
}

function FieldRow({
  label,
  field,
}: {
  label: string;
  field: FieldWithStatus | FieldWithStatus<string[]>;
}) {
  const values = Array.isArray(field.value) ? field.value : [field.value];
  return (
    <div className="min-w-0 space-y-1 rounded-[18px] border border-violet-400/12 bg-white/[0.03] px-4 py-3 transition duration-200 hover:border-violet-300/28 hover:bg-white/[0.05]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>
        <StatusBadge status={field.status} note={field.note} />
      </div>
      {values.length === 1 ? (
        <p className="break-words text-sm leading-relaxed text-zinc-100">{values[0]}</p>
      ) : (
        <ul className="space-y-1">
          {values.map((v) => (
            <li key={v} className="flex items-start gap-2 text-sm leading-relaxed text-zinc-100">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
              {v}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SectionCard({
  title,
  children,
  onCopy,
  tone,
}: {
  title: string;
  children: ReactNode;
  onCopy?: () => void;
  tone: {
    shell: string;
    header: string;
    button: string;
  };
}) {
  return (
    <div className={`group relative min-w-0 overflow-hidden rounded-[28px] p-5 shadow-[0_24px_88px_rgba(0,0,0,0.3)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_96px_rgba(0,0,0,0.36)] ${tone.shell}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_34%)]" />
      <div className="relative mb-5 flex flex-wrap items-center justify-between gap-3 pb-4 transition-colors">
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.26em] ${tone.header}`}>结果模块</p>
          <h4 className="mt-1 text-lg font-semibold text-white">{title}</h4>
        </div>
        {onCopy && (
          <Button size="sm" variant="flat" className={`border bg-white/5 ${tone.button}`} onPress={onCopy}>
            复制结果
          </Button>
        )}
      </div>
      <div className="min-w-0 space-y-4">{children}</div>
    </div>
  );
}

export function ProductResultView({ data }: { data: ProductExtractResult }) {
  return (
    <SectionCard
      title="产品提取结果"
      tone={{
        shell: 'bg-[linear-gradient(180deg,rgba(18,29,44,0.96),rgba(10,15,24,0.96))]',
        header: 'text-sky-200',
        button: 'text-sky-100 hover:text-white',
      }}
      onCopy={() =>
        copyText(
          [
            `产品名称：${data.productName.value}`,
            `品类：${data.category.value}`,
            `属性：${(data.attributes.value as string[]).join('、')}`,
            `卖点：${(data.sellingPoints.value as string[]).join('；')}`,
            `摘要：${data.summary}`,
          ].join('\n'),
        )
      }
    >
      <FieldRow label="产品名称" field={data.productName} />
      <FieldRow label="品类识别" field={data.category} />
      <FieldRow label="产品属性" field={data.attributes} />
      <FieldRow label="核心卖点" field={data.sellingPoints} />
      <Divider className="bg-white/10" />
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">产品摘要</p>
        <p className="break-words text-sm leading-relaxed text-zinc-300">{data.summary}</p>
      </div>
    </SectionCard>
  );
}

export function MarketResultView({ data }: { data: MarketResearchResult }) {
  return (
    <SectionCard
      title="市场分析结果"
      tone={{
        shell: 'bg-[linear-gradient(180deg,rgba(42,25,18,0.96),rgba(22,14,10,0.96))]',
        header: 'text-orange-200',
        button: 'text-orange-100 hover:text-white',
      }}
      onCopy={() =>
        copyText(
          [
            `市场趋势：${data.marketTrends}`,
            `竞品风格：${data.competitorStyle}`,
            `用户画像：${data.userPersona}`,
            `品牌调性：${data.brandTone}`,
            `视觉风格：${data.visualStyle}`,
            `营销建议：${data.marketingSuggestions.join('；')}`,
          ].join('\n\n'),
        )
      }
    >
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">市场趋势</p>
        <p className="break-words text-sm leading-relaxed text-zinc-300">{data.marketTrends}</p>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">竞品风格</p>
        <p className="break-words text-sm leading-relaxed text-zinc-300">{data.competitorStyle}</p>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">用户画像</p>
        <p className="break-words text-sm leading-relaxed text-zinc-300">{data.userPersona}</p>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">品牌调性</p>
        <p className="break-words text-sm leading-relaxed text-zinc-300">{data.brandTone}</p>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">视觉风格</p>
        <p className="break-words text-sm leading-relaxed text-zinc-300">{data.visualStyle}</p>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">营销建议</p>
        <ul className="space-y-2">
          {data.marketingSuggestions.map((s) => (
            <li
              key={s}
              className="min-w-0 break-words rounded-lg bg-violet-500/10 px-3 py-2 text-sm text-violet-100"
            >
              {s}
            </li>
          ))}
        </ul>
      </div>
    </SectionCard>
  );
}

function GenerationStatusCard({
  label,
  data,
}: {
  label: string;
  data?: {
    status?: string;
    requestId?: string;
    url?: string;
    prompt?: string;
    message?: string;
    error?: string;
    timings?: Record<string, unknown>;
    seed?: number | string;
    images?: Array<{ url: string }>;
    raw?: Record<string, unknown>;
    jobId?: string;
  };
}) {
  if (!data) return null;

  const previewUrls = [
    ...(data.images?.map((img) => img.url).filter(Boolean) ?? []),
    ...(data.url ? [data.url] : []),
  ];
  const firstPreviewUrl = previewUrls[0];
  const copyLink = (link: string) => {
    void navigator.clipboard.writeText(link);
  };

  return (
    <div className="rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4 shadow-[0_16px_42px_rgba(0,0,0,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.07]">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
        <Chip size="sm" variant="flat" color={data.status === 'failed' ? 'danger' : data.status === 'completed' || data.url ? 'success' : 'warning'}>
          {data.status === 'submitted' ? '已提交' : data.status === 'processing' ? '处理中' : data.status === 'completed' ? '已完成' : data.status === 'failed' ? '失败' : data.status ?? '待处理'}
        </Chip>
        {data.jobId && <Chip size="sm" variant="flat" color="default">job {data.jobId}</Chip>}
        {data.requestId && <Chip size="sm" variant="flat" color="secondary">request {data.requestId}</Chip>}
      </div>
      {data.message && <p className="text-sm text-zinc-200">{data.message}</p>}
      {data.prompt && <p className="mt-2 text-xs text-zinc-400">提示词：{data.prompt}</p>}
      {label === '图片生成' && previewUrls.length > 0 && (
        <div className="mt-3 space-y-3">
          <a
            href={firstPreviewUrl}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-[18px] border border-violet-400/14 bg-black/30 transition hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-950/20"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={firstPreviewUrl}
              alt="生成图片预览"
              className="h-auto w-full max-h-[420px] object-contain"
            />
          </a>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="flat" color="secondary" onPress={() => copyLink(firstPreviewUrl)} className="border border-violet-400/18 bg-white/5 text-violet-100">
              复制链接
            </Button>
            <Button size="sm" variant="flat" as="a" href={firstPreviewUrl} target="_blank" rel="noreferrer" className="border border-violet-400/18 bg-white/5 text-violet-100">
              打开原图
            </Button>
          </div>
          {previewUrls.length > 1 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {previewUrls.map((url, index) => (
                <div key={url} className="rounded-[18px] border border-violet-400/14 bg-black/20 p-2">
                  <a href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`生成图片 ${index + 1}`}
                      className="h-36 w-full object-cover"
                    />
                  </a>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-zinc-500">图片 {index + 1}</p>
                    <Button size="sm" variant="light" onPress={() => copyLink(url)}>
                      复制链接
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {data.url && label !== '图片生成' && (
        <a
          href={data.url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block break-all text-sm text-emerald-300 underline decoration-emerald-400/40 underline-offset-4 hover:text-emerald-200"
        >
          结果链接：{data.url}
        </a>
      )}
      {data.images?.length && label !== '图片生成' ? (
        <div className="mt-3 space-y-2">
          {data.images.map((img) => (
            <a
              key={img.url}
              href={img.url}
              target="_blank"
              rel="noreferrer"
              className="block break-all text-sm text-emerald-300 underline decoration-emerald-400/40 underline-offset-4 hover:text-emerald-200"
            >
              图片链接：{img.url}
            </a>
          ))}
        </div>
      ) : null}
      {data.seed !== undefined && <p className="mt-2 text-xs text-zinc-500">Seed：{String(data.seed)}</p>}
      {data.timings && <p className="mt-2 text-xs text-zinc-500">Timings：{JSON.stringify(data.timings)}</p>}
      {data.error && <p className="mt-2 text-sm text-red-300">错误：{data.error}</p>}
    </div>
  );
}

export function ContentResultView({ data }: { data: ContentGenerateResult }) {
  return (
    <SectionCard
      title="内容生成结果"
      tone={{
        shell: 'bg-[linear-gradient(180deg,rgba(34,20,48,0.96),rgba(18,12,26,0.96))] hover:shadow-[0_28px_110px_rgba(0,0,0,0.42)] hover:scale-[1.01]',
        header: 'text-fuchsia-200',
        button: 'text-fuchsia-100 hover:text-white',
      }}
      onCopy={() =>
        copyText(
          [
            `标题：${data.title}`,
            `卖点：${data.sellingPointCopy.join('；')}`,
            `详情页：${data.detailPageContent}`,
            `转化描述：${data.conversionDescription}`,
            `视频脚本：${data.videoScript}`,
            `海报标题：${data.posterCopy?.headline ?? ''}`,
            `海报副标题：${data.posterCopy?.subheadline ?? ''}`,
            `海报口号：${data.posterCopy?.slogan ?? ''}`,
            `视频钩子：${data.videoMaterial?.hook ?? ''}`,
            `视频口播：${data.videoMaterial?.voiceover ?? ''}`,
            `视频字幕：${data.videoMaterial?.caption ?? ''}`,
            `图片创意：${(data.imageIdeas ?? [])
              .map((item) => `${item.title}｜${item.description}｜${item.usage}`)
              .join('\n')}`,
          ].join('\n\n'),
        )
      }
    >
      <GenerationStatusCard label="图片生成" data={data.imageGeneration} />
      <div className="rounded-[22px] border border-violet-400/14 bg-gradient-to-r from-violet-500/16 to-fuchsia-500/10 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.16)] ring-1 ring-violet-400/10">
        <p className="mb-1 text-xs text-violet-300">内容总标题</p>
        <p className="break-words text-lg font-semibold text-white">{data.title}</p>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">卖点文案</p>
        <div className="flex flex-wrap gap-2">
          {data.sellingPointCopy.map((sp) => (
            <Chip key={sp} variant="flat" color="secondary" className="border border-violet-400/18 bg-violet-500/12 text-violet-100">
              {sp}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">详情页内容</p>
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-300">
          {data.detailPageContent}
        </p>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">转化描述</p>
        <p className="break-words text-sm leading-relaxed text-zinc-300">{data.conversionDescription}</p>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">视频脚本</p>
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-300">{data.videoScript}</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-3 sm:grid-cols-2">
        <div className="rounded-[18px] border border-fuchsia-400/14 bg-fuchsia-500/8 p-3 transition duration-200 hover:border-fuchsia-300/28 hover:bg-fuchsia-500/10">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-fuchsia-200/80">海报标题</p>
          <p className="text-sm leading-relaxed text-zinc-100">{data.posterCopy?.headline ?? '暂无'}</p>
        </div>
        <div className="rounded-[18px] border border-fuchsia-400/14 bg-fuchsia-500/8 p-3 transition duration-200 hover:border-fuchsia-300/28 hover:bg-fuchsia-500/10">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-fuchsia-200/80">海报副标题</p>
          <p className="text-sm leading-relaxed text-zinc-100">{data.posterCopy?.subheadline ?? '暂无'}</p>
        </div>
        <div className="rounded-[18px] border border-fuchsia-400/14 bg-fuchsia-500/8 p-3 transition duration-200 hover:border-fuchsia-300/28 hover:bg-fuchsia-500/10">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-fuchsia-200/80">海报口号</p>
          <p className="text-sm leading-relaxed text-zinc-100">{data.posterCopy?.slogan ?? '暂无'}</p>
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">图片创意</p>
        <div className="space-y-2">
          {(data.imageIdeas ?? []).length > 0 ? (
            (data.imageIdeas ?? []).map((item) => (
              <div key={`${item.title}-${item.usage}`} className="rounded-lg border border-fuchsia-400/12 bg-fuchsia-500/6 p-3 transition duration-200 hover:border-fuchsia-300/22 hover:bg-fuchsia-500/10">
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="mt-1 text-sm text-zinc-300">{item.description}</p>
                <p className="mt-1 text-xs text-fuchsia-200/70">适用场景：{item.usage}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-500">暂无</p>
          )}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">视频素材</p>
        {data.videoMaterial ? (
          <div className="space-y-2 rounded-[18px] border border-cyan-400/14 bg-cyan-500/8 p-3 transition duration-200 hover:border-cyan-300/24 hover:bg-cyan-500/10">
            <p className="text-sm text-zinc-100">钩子：{data.videoMaterial.hook}</p>
            <p className="whitespace-pre-wrap text-sm text-zinc-300">口播：{data.videoMaterial.voiceover}</p>
            <p className="text-sm text-zinc-300">字幕：{data.videoMaterial.caption}</p>
            <div>
              <p className="mb-1 text-xs text-cyan-200/70">分镜</p>
              <ul className="space-y-1">
                {data.videoMaterial.scenes.map((scene) => (
                  <li key={scene} className="text-sm text-zinc-300">· {scene}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">暂无</p>
        )}
      </div>
    </SectionCard>
  );
}

export function SeoResultView({ data }: { data: SeoOptimizeResult }) {
  return (
    <SectionCard
      title="SEO 优化结果"
      tone={{
        shell: 'bg-[linear-gradient(180deg,rgba(17,34,31,0.96),rgba(10,20,18,0.96))]',
        header: 'text-emerald-200',
        button: 'text-emerald-100 hover:text-white',
      }}
      onCopy={() =>
        copyText(
          [
            `关键词：${data.keywords.join('、')}`,
            `优化标题：${data.optimizedTitle}`,
            `搜索友好文案：${data.searchFriendlyCopy}`,
            `小红书：${data.channelAdaptation?.xiaohongshu ?? '暂无'}`,
            `微博：${data.channelAdaptation?.weibo ?? '暂无'}`,
            `抖音：${data.channelAdaptation?.douyin ?? '暂无'}`,
          ].join('\n\n'),
        )
      }
    >
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">关键词</p>
        <div className="flex flex-wrap gap-2">
          {data.keywords.map((kw) => (
            <Chip
              key={kw}
              size="sm"
              variant="bordered"
              className="border-emerald-500/40 text-emerald-300"
            >
              {kw}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">优化标题</p>
        <p className="text-base font-medium text-white">{data.optimizedTitle}</p>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">搜索友好文案</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
          {data.searchFriendlyCopy}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">小红书适配</p>
          <p className="whitespace-pre-wrap text-sm text-zinc-300">{data.channelAdaptation?.xiaohongshu ?? '暂无'}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">微博适配</p>
          <p className="whitespace-pre-wrap text-sm text-zinc-300">{data.channelAdaptation?.weibo ?? '暂无'}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">抖音适配</p>
          <p className="whitespace-pre-wrap text-sm text-zinc-300">{data.channelAdaptation?.douyin ?? '暂无'}</p>
        </div>
      </div>
    </SectionCard>
  );
}

export function SocialResultView({ data }: { data: SocialGenerateResult }) {
  return (
    <SectionCard
      title="社媒适配结果"
      tone={{
        shell: 'bg-[linear-gradient(180deg,rgba(22,28,42,0.96),rgba(12,16,24,0.96))]',
        header: 'text-cyan-200',
        button: 'text-cyan-100 hover:text-white',
      }}
      onCopy={() =>
        copyText(
          data.copies
            .map(
              (c) =>
                `【${PLATFORM_LABELS[c.platform] ?? c.platform}】\n${c.content}\n${c.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ')}`,
            )
            .join('\n\n---\n\n'),
        )
      }
    >
      <div className="space-y-4">
        {data.copies.map((copy) => (
          <div
            key={copy.platform}
            className="rounded-[22px] border border-cyan-400/12 bg-cyan-500/8 p-4 shadow-[0_14px_36px_rgba(8,47,73,0.12)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/22 hover:bg-cyan-500/10"
          >
            <Chip size="sm" color="secondary" variant="flat" className="mb-3">
              {PLATFORM_LABELS[copy.platform] ?? copy.platform}
            </Chip>
            <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
              {copy.content}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {copy.hashtags.map((tag) => (
                <span key={tag} className="text-xs text-violet-400">
                  #{tag.replace(/^#/, '')}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      {data.scriptSuggestion && (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
            短视频脚本建议
          </p>
          <p className="whitespace-pre-wrap text-sm text-zinc-400">{data.scriptSuggestion}</p>
        </div>
      )}
    </SectionCard>
  );
}

export function MergeResultView({ data }: { data: MergeResult }) {
  const pkg = data.package;
  return (
    <div className="space-y-4">
      {data.pendingConfirmations.length > 0 && (
        <div className="rounded-[22px] border border-amber-500/22 bg-amber-500/10 p-4 shadow-[0_16px_42px_rgba(120,53,15,0.12)] transition duration-200 hover:-translate-y-0.5 hover:border-amber-400/32 hover:bg-amber-500/14">
          <p className="mb-2 text-sm font-medium text-amber-200">待确认项</p>
          <ul className="space-y-1">
            {data.pendingConfirmations.map((item) => (
              <li key={item} className="text-sm text-amber-100/80">
                · {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.consistencyNotes.length > 0 && (
        <div className="rounded-[22px] border border-violet-400/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-violet-300/22 hover:bg-white/[0.07]">
          <p className="mb-2 text-sm font-medium text-zinc-300">一致性说明</p>
          <ul className="space-y-1">
            {data.consistencyNotes.map((note) => (
              <li key={note} className="text-sm text-zinc-500">
                · {note}
              </li>
            ))}
          </ul>
        </div>
      )}
      <ProductResultView data={pkg.product} />
      <MarketResultView data={pkg.market} />
      <ContentResultView data={pkg.content} />
      <SeoResultView data={pkg.seo} />
      <SocialResultView data={pkg.social} />
    </div>
  );
}
