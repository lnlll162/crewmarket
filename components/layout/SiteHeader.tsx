export function SiteHeader() {
  return (
    <header className="border-b border-white/10 bg-black/20 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <a href="/" className="text-lg font-semibold tracking-tight text-white">
          Crew<span className="text-violet-400">Market</span>
        </a>
        <p className="text-sm text-zinc-400">CrewAI · 电商营销内容生成</p>
      </div>
    </header>
  );
}
