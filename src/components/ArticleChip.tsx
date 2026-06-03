import { useState } from 'react'
import { Hash, Copy, Check } from 'lucide-react'

export default function ArticleChip({ article, onClick }: { article: string; onClick?: (e: React.MouseEvent) => void }) {
  const [copied, setCopied] = useState(false)

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    onClick?.(e)
    navigator.clipboard.writeText(article).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 bg-slate-800 text-white px-2 py-1 rounded-lg text-xs font-mono active:bg-slate-700 transition-colors"
    >
      <Hash className="w-3 h-3 opacity-50" />
      <span>{article}</span>
      {copied
        ? <Check className="w-3 h-3 text-green-400" />
        : <Copy className="w-3 h-3 opacity-50" />
      }
    </button>
  )
}
