type Row = { key: string; value: string; verify?: boolean }

type Props = { file: string; rows: Row[] }

/** `$ cat now.txt` card. Values come from data, not from here. */
export function Terminal({ file, rows }: Props) {
  const pad = Math.max(...rows.map((r) => r.key.length))
  return (
    <div className="card overflow-hidden">
      <div className="flex h-8 items-center gap-2 border-b border-line px-3" aria-hidden="true">
        <span className="h-2 w-2 rounded-full bg-text-3/60" />
        <span className="h-2 w-2 rounded-full bg-text-3/60" />
        <span className="h-2 w-2 rounded-full bg-text-3/60" />
        <span className="font-mono ml-2 text-[10px] text-text-3">zsh</span>
      </div>
      <pre className="font-mono overflow-x-auto p-4 text-[12.5px] leading-[1.9] text-text-2 md:text-[13px]">
        <div className="text-text">$ cat {file}</div>
        {rows.map((r) => (
          <div key={r.key}>
            <span className="text-text-3">{r.key.padEnd(pad)} : </span>
            <span className="text-text">{r.value}</span>
            {r.verify && <span className="text-text-3">{'  # verify'}</span>}
          </div>
        ))}
        <div className="text-text">
          $ <span className="caret" aria-hidden="true" />
        </div>
      </pre>
    </div>
  )
}
