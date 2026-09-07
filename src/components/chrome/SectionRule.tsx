type Props = { index: string; label: string }

/** ── 02 · WORK ── : the hairline + mono eyebrow that gives the page its rhythm. */
export function SectionRule({ index, label }: Props) {
  return (
    <div className="rule eyebrow" aria-hidden="true">
      <span>
        {index} · {label}
      </span>
    </div>
  )
}

type HeaderProps = { index: string; label: string; title: string; sub?: React.ReactNode; id?: string; right?: React.ReactNode }

export function SectionHeader({ index, label, title, sub, id, right }: HeaderProps) {
  return (
    <header className="mb-12 md:mb-16">
      <SectionRule index={index} label={label} />
      <div className="mt-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h2 id={id} className="section-title" data-reveal>
            {title}
          </h2>
          {sub && (
            <p className="font-mono mt-4 max-w-[62ch] text-[13px] leading-relaxed text-text-2" data-reveal>
              {sub}
            </p>
          )}
        </div>
        {right}
      </div>
    </header>
  )
}
