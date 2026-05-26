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
} from '../../types';
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
      className="ml-2"
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
    <div className="min-w-0 space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</span>
        <StatusBadge status={field.status} note={field.note} />
      </div>
      {values.length === 1 ? (
        <p className="break-words text-sm text-zinc-200">{values[0]}</p>
      ) : (
        <ul className="space-y-1">
          {values.map((v) => (
            <li key={v} className="flex items-start gap-2 text-sm text-zinc-200">
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
}: {
  title: string;
  children: ReactNode;
  onCopy?: () => void;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-5 shadow-lg shadow-black/10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold text-white">{title}</h4>
        </div>
        {onCopy && (
          <Button size="sm" variant="flat" onPress={onCopy}>
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

export function ContentResultView({ data }: { data: ContentGenerateResult }) {
  return (
    <SectionCard
      title="内容生成结果"
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
      <div className="rounded-lg bg-gradient-to-r from-violet-500/20 to-fuchsia-500/10 p-4">
        <p className="mb-1 text-xs text-violet-300">内容总标题</p>
        <p className="break-words text-lg font-semibold text-white">{data.title}</p>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">卖点文案</p>
        <div className="flex flex-wrap gap-2">
          {data.sellingPointCopy.map((sp) => (
            <Chip key={sp} variant="flat" color="secondary">
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
        <div className="rounded-lg bg-white/[0.03] p-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">海报标题</p>
          <p className="text-sm leading-relaxed text-zinc-200">{data.posterCopy?.headline ?? '暂无'}</p>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">海报副标题</p>
          <p className="text-sm leading-relaxed text-zinc-200">{data.posterCopy?.subheadline ?? '暂无'}</p>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">海报口号</p>
          <p className="text-sm leading-relaxed text-zinc-200">{data.posterCopy?.slogan ?? '暂无'}</p>
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">图片创意</p>
        <div className="space-y-2">
          {(data.imageIdeas ?? []).length > 0 ? (
            (data.imageIdeas ?? []).map((item) => (
              <div key={`${item.title}-${item.usage}`} className="rounded-lg bg-white/[0.03] p-3">
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="mt-1 text-sm text-zinc-300">{item.description}</p>
                <p className="mt-1 text-xs text-zinc-500">适用场景：{item.usage}</p>
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
          <div className="space-y-2 rounded-lg bg-white/[0.03] p-3">
            <p className="text-sm text-zinc-200">钩子：{data.videoMaterial.hook}</p>
            <p className="whitespace-pre-wrap text-sm text-zinc-300">口播：{data.videoMaterial.voiceover}</p>
            <p className="text-sm text-zinc-300">字幕：{data.videoMaterial.caption}</p>
            <div>
              <p className="mb-1 text-xs text-zinc-500">分镜</p>
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
      onCopy={() =>
        copyText(
          [
            `关键词：${data.keywords.join('、')}`,
            `优化标题：${data.optimizedTitle}`,
            `搜索友好文案：${data.searchFriendlyCopy}`,
            `小红书：${data.channelAdaptation.xiaohongshu}`,
            `微博：${data.channelAdaptation.weibo}`,
            `抖音：${data.channelAdaptation.douyin}`,
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
          <p className="whitespace-pre-wrap text-sm text-zinc-300">{data.channelAdaptation.xiaohongshu}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">微博适配</p>
          <p className="whitespace-pre-wrap text-sm text-zinc-300">{data.channelAdaptation.weibo}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">抖音适配</p>
          <p className="whitespace-pre-wrap text-sm text-zinc-300">{data.channelAdaptation.douyin}</p>
        </div>
      </div>
    </SectionCard>
  );
}

export function SocialResultView({ data }: { data: SocialGenerateResult }) {
  return (
    <SectionCard
      title="社媒适配结果"
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
            className="rounded-xl border border-white/5 bg-white/[0.03] p-4"
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
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
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
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
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
