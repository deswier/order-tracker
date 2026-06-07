import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Image, X } from 'lucide-react'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const galleryRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
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
      if (galleryRef.current) galleryRef.current.value = ''
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
        onClick={() => galleryRef.current?.click()}
        disabled={uploading}
        className="h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1.5 text-gray-400 active:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <Image className="w-5 h-5" />
        <span className="text-xs">{uploading ? 'Загружаем...' : 'Выбрать из галереи'}</span>
      </button>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
