export const MODEL_SELECT_POPOVER_PROPS = {
  placement: 'bottom' as const,
  offset: 10,
  shouldBlockScroll: true,
  classNames: {
    content:
      'z-[9999] max-h-72 overflow-hidden border border-violet-400/20 bg-[#12121a] p-1 shadow-[0_24px_64px_rgba(0,0,0,0.55)] backdrop-blur-xl',
  },
};

export const MODEL_SELECT_CLASS_NAMES = {
  trigger:
    'group min-h-11 border border-white/10 bg-white/[0.04] data-[hover=true]:bg-white/[0.07]',
  value: 'text-sm text-zinc-100 truncate pl-6',
  innerWrapper: 'max-w-full overflow-hidden',
  selectorIcon:
    'absolute left-2 top-1/2 flex-shrink-0 -translate-y-1/2 -rotate-90 text-zinc-400 transition-transform duration-200 ease-in-out group-data-[open=true]:rotate-0',
};

export const MODEL_SELECT_LISTBOX_CLASS_NAME = 'max-h-60 overflow-y-auto';
