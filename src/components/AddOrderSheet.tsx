import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ImageUpload from '@/components/ImageUpload'
import { Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useOrders } from '@/contexts/OrdersContext'

export default function AddOrderSheet() {
  const { user } = useAuth()
  const { createOrder } = useOrders()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    expected_price: '',
    ozon_url: '',
    image_url: '',
    size: '',
  })

  function set(field: keyof typeof form, value: string) {
    setForm(p => ({ ...p, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !form.title || !form.expected_price || !form.ozon_url.trim()) return
    const price = parseFloat(form.expected_price.replace(',', '.'))
    if (isNaN(price) || price <= 0) return
    setLoading(true)
    try {
      const id = await createOrder({
        title: form.title.trim(),
        expected_price: price,
        ozon_url: form.ozon_url.trim() || undefined,
        image_url: form.image_url || undefined,
        size: form.size.trim() || undefined,
        created_by: user.id,
      })
      setForm({ title: '', expected_price: '', ozon_url: '', image_url: '', size: '' })
      setOpen(false)
      navigate(`/orders/${id}`)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const [fetchingImage, setFetchingImage] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const url = form.ozon_url.trim()
    if (!url || form.image_url) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setFetchingImage(true)
      try {
        const res = await fetch(`/api/og-image?url=${encodeURIComponent(url)}`)
        const json = await res.json()
        if (json.imageUrl) set('image_url', json.imageUrl)
      } catch { /* тихо игнорируем */ } finally {
        setFetchingImage(false)
      }
    }, 700)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [form.ozon_url])

  const canSubmit = !!form.title && !!form.expected_price && !!form.ozon_url.trim() && !loading

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform z-40"
          aria-label="Добавить заказ"
        >
          <Plus className="w-7 h-7" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый заказ</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="a-title">Название *</Label>
            <Input
              id="a-title"
              placeholder="Что купить?"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="a-price">Ожидаемая цена (₽) *</Label>
            <Input
              id="a-price"
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={form.expected_price}
              onChange={e => set('expected_price', e.target.value)}
              required
              min="0.01"
              step="0.01"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="a-url">Ссылка на Ozon *</Label>
            <Input
              id="a-url"
              type="url"
              placeholder="https://ozon.ru/..."
              value={form.ozon_url}
              onChange={e => set('ozon_url', e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="a-size">Размер</Label>
            <Input
              id="a-size"
              placeholder="XL, 42, 10kg..."
              value={form.size}
              onChange={e => set('size', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="flex items-center gap-2">
              Фото
              {fetchingImage && (
                <span className="text-xs text-gray-400 font-normal">загружаем с Ozon...</span>
              )}
            </Label>
            <ImageUpload value={form.image_url} onChange={v => set('image_url', v)} />
          </div>

          <Button type="submit" size="lg" disabled={!canSubmit} className="mt-1">
            {loading ? 'Добавляем...' : 'Добавить заказ'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
