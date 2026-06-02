import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Camera, X, Link } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlValue, setUrlValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('order-images')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('order-images').getPublicUrl(path)
      onChange(data.publicUrl)
    } catch {
      setError('Ошибка загрузки. Создайте бакет order-images в Supabase Storage.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  if (value) {
    return (
      <div className="relative">
        <img
          src={value}
          alt="Фото товара"
          className="w-full h-44 object-cover rounded-xl bg-gray-100"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5 active:bg-black/70"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 active:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <Camera className="w-7 h-7" />
        <span className="text-sm">{uploading ? 'Загружаем...' : 'Выбрать фото'}</span>
      </button>

      {!showUrlInput ? (
        <button
          type="button"
          onClick={() => setShowUrlInput(true)}
          className="flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 py-1"
        >
          <Link className="w-3 h-3" />
          Вставить ссылку на фото
        </button>
      ) : (
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://..."
            value={urlValue}
            onChange={e => setUrlValue(e.target.value)}
            className="text-sm h-10"
          />
          <button
            type="button"
            onClick={() => { onChange(urlValue); setShowUrlInput(false) }}
            className="px-3 h-10 bg-blue-600 text-white rounded-lg text-sm font-medium shrink-0"
          >
            ОК
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
