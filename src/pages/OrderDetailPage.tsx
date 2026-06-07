import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useOrders } from '@/contexts/OrdersContext'
import { useAuth } from '@/contexts/AuthContext'
import {
  TRANSITIONS,
  TRANSITION_LABELS,
  TRANSITION_VARIANTS,
} from '@/lib/statusMachine'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import StatusBadge from '@/components/StatusBadge'
import ImageUpload from '@/components/ImageUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { formatPrice } from '@/lib/utils'
import { ArrowLeft, ExternalLink, Minus, Pencil, Ruler, Trash2, X } from 'lucide-react'
import AccountInput from '@/components/AccountInput'
import ArticleChip from '@/components/ArticleChip'
import type { Order, OrderStatus } from '@/types'

type TField = 'actual_price' | 'account' | 'delivery_date' | 'return_number'

const TRANSITION_FIELDS: Partial<Record<string, TField[]>> = {
  NEW_ORDERED: ['actual_price', 'account', 'delivery_date'],
  RETURN_NEEDED_RETURN_PENDING: ['return_number'],
}

const TRANSITION_DIALOG_TITLES: Partial<Record<string, string>> = {
  NEW_ORDERED: 'Оформить заказ',
  RETURN_NEEDED_RETURN_PENDING: 'Оформить возврат',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function ViewRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value || '—'}</span>
    </div>
  )
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { updateOrder, deleteOrder, refetch } = useOrders()
  const { user } = useAuth()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  const [form, setForm] = useState({
    title: '',
    article: '',
    ozon_url: '',
    image_url: '',
    expected_price: '',
    actual_price: '',
    account: '',
    delivery_date: '',
    return_number: '',
    size: '',
  })
  const [formErrors, setFormErrors] = useState<Set<string>>(new Set())

  const [pendingTransition, setPendingTransition] = useState<OrderStatus | null>(null)
  const [tForm, setTForm] = useState({ actual_price: '', account: '', delivery_date: '', return_number: '' })
  const [tErrors, setTErrors] = useState<Set<string>>(new Set())

  function formFromOrder(o: Order) {
    return {
      title: o.title,
      ozon_url: o.ozon_url ?? '',
      image_url: o.image_url ?? '',
      expected_price: String(o.expected_price),
      actual_price: o.actual_price != null ? String(o.actual_price) : '',
      account: o.account ?? '',
      delivery_date: o.delivery_date ?? '',
      return_number: o.return_number ?? '',
      size: o.size ?? '',
      article: o.article ?? '',
    }
  }

  useEffect(() => {
    if (!id) return
    supabase.from('orders').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setOrder(data)
        setForm(formFromOrder(data))
      }
      setLoading(false)
    })
  }, [id])

  async function applyUpdate(updates: Partial<Order>) {
    if (!order) return
    setSaving(true)
    try {
      await updateOrder(order.id, updates)
      setOrder(prev => prev ? { ...prev, ...updates } : prev)
    } finally {
      setSaving(false)
    }
  }

  function cancelEdit() {
    if (!order) return
    setEditing(false)
    setFormErrors(new Set())
    setForm(formFromOrder(order))
  }

  function openTransition(nextStatus: OrderStatus) {
    if (!order) return
    const key = `${order.status}_${nextStatus}`
    if (TRANSITION_FIELDS[key]) {
      setTForm({
        actual_price: order.actual_price != null ? String(order.actual_price) : '',
        account: order.account ?? '',
        delivery_date: order.delivery_date ?? '',
        return_number: order.return_number ?? '',
      })
      setTErrors(new Set())
      setPendingTransition(nextStatus)
    } else {
      void applyUpdate({ status: nextStatus })
    }
  }

  async function confirmTransition() {
    if (!order || !pendingTransition) return
    const key = `${order.status}_${pendingTransition}`
    const fields = TRANSITION_FIELDS[key] ?? []

    const today = new Date().toISOString().slice(0, 10)
    const errs = new Set<string>()
    if (fields.includes('actual_price') && !tForm.actual_price) errs.add('actual_price')
    if (fields.includes('account') && !tForm.account.trim()) errs.add('account')
    if (fields.includes('delivery_date') && !tForm.delivery_date) errs.add('delivery_date')
    if (fields.includes('delivery_date') && tForm.delivery_date && tForm.delivery_date < today) errs.add('delivery_date')
    if (fields.includes('return_number') && !tForm.return_number.trim()) errs.add('return_number')
    if (errs.size > 0) { setTErrors(errs); return }

    const updates: Partial<Order> = { status: pendingTransition }
    if (fields.includes('actual_price')) updates.actual_price = parseFloat(tForm.actual_price)
    if (fields.includes('account')) updates.account = tForm.account.trim() || null
    if (fields.includes('delivery_date')) updates.delivery_date = tForm.delivery_date || null
    if (fields.includes('return_number')) updates.return_number = tForm.return_number.trim() || null

    await applyUpdate(updates)
    setForm(p => ({
      ...p,
      ...(fields.includes('actual_price') && { actual_price: tForm.actual_price }),
      ...(fields.includes('account') && { account: tForm.account }),
      ...(fields.includes('delivery_date') && { delivery_date: tForm.delivery_date }),
      ...(fields.includes('return_number') && { return_number: tForm.return_number }),
    }))
    setPendingTransition(null)
    void refetch()
  }

  async function handleSave() {
    if (!order) return
    const isOrdered = order.status !== 'NEW'
    const showReturnNum = order.status === 'RETURN_PENDING'

    const errs = new Set<string>()
    if (!form.title.trim()) errs.add('title')
    if (!form.ozon_url.trim()) errs.add('ozon_url')
    if (isOrdered && !form.actual_price) errs.add('actual_price')
    if (isOrdered && !form.account.trim()) errs.add('account')
    if (showReturnNum && !form.return_number.trim()) errs.add('return_number')
    if (errs.size > 0) { setFormErrors(errs); return }
    setFormErrors(new Set())

    const updates: Partial<Order> = {
      title: form.title.trim(),
      ozon_url: form.ozon_url.trim() || null,
      image_url: form.image_url || null,
      actual_price: form.actual_price ? parseFloat(form.actual_price) : null,
      account: form.account.trim() || null,
      delivery_date: form.delivery_date || null,
      return_number: form.return_number.trim() || null,
      size: form.size.trim() || null,
      article: form.article.trim() || null,
    }
    if (!isOrdered) {
      updates.expected_price = parseFloat(form.expected_price) || order.expected_price
    }

    await applyUpdate(updates)
    setEditing(false)
    await refetch()
    navigate(-1)
  }

  async function handleDelete() {
    if (!order || !confirm('Удалить заказ?')) return
    await deleteOrder(order.id)
    await refetch()
    navigate(-1)
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-gray-400 text-lg">Загрузка...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4">
        <div className="text-gray-500">Заказ не найден</div>
        <Button variant="outline" onClick={() => navigate(-1)}>Назад</Button>
      </div>
    )
  }

  const isOrdered = order.status !== 'NEW'
  const availableTransitions = TRANSITIONS[order.status]
  const showSettled = ['RECEIVED', 'RETURN_NEEDED', 'RETURN_PENDING', 'RETURNED'].includes(order.status)
  const showReturnNum = order.status === 'RETURN_PENDING'

  const transitionKey = pendingTransition ? `${order.status}_${pendingTransition}` : ''
  const pendingFields = TRANSITION_FIELDS[transitionKey] ?? []

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      {/* Header */}
      <div
        className="bg-white border-b border-gray-100 px-4 flex items-center gap-2 flex-shrink-0"
        style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(3.5rem + env(safe-area-inset-top))' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full active:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{order.title}</p>
        </div>
        {editing ? (
          <button
            onClick={cancelEdit}
            className="p-2 rounded-full active:bg-gray-100 transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="p-2 rounded-full active:bg-blue-50 transition-colors text-blue-500"
          >
            <Pencil className="w-5 h-5" />
          </button>
        )}
        {order && user?.id === order.created_by && (
          <button
            onClick={handleDelete}
            className="p-2 rounded-full active:bg-red-50 transition-colors text-red-400"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className={`flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 ${
        !editing && availableTransitions.length > 0
          ? 'pb-[calc(11rem+env(safe-area-inset-bottom))]'
          : 'pb-[calc(7rem+env(safe-area-inset-bottom))]'
      }`}>
        {/* Image — маленькая в просмотре, открывается по клику */}
        {order.image_url && !editing && (
          <>
            <button
              onClick={() => setLightbox(true)}
              className="self-start rounded-2xl overflow-hidden shadow-sm border border-gray-100 active:opacity-80 transition-opacity"
            >
              <img
                src={order.image_url}
                alt={order.title}
                className="w-24 h-24 object-cover block bg-gray-100"
                onError={e => { (e.target as HTMLImageElement).closest('button')!.style.display = 'none' }}
              />
            </button>
            {lightbox && (
              <div
                className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                onClick={() => setLightbox(false)}
              >
                <img
                  src={order.image_url}
                  alt={order.title}
                  className="max-w-full max-h-full rounded-2xl object-contain"
                />
              </div>
            )}
          </>
        )}

        {/* Status + price */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
          <StatusBadge status={order.status} />
          <div className="text-right flex flex-col items-end gap-0.5">
            {order.actual_price != null ? (
              <>
                <div className="text-lg font-bold text-blue-600">{formatPrice(order.actual_price)}</div>
                {(() => {
                  const diff = order.expected_price / 2 - order.actual_price
                  if (diff === 0) return <Minus className="w-3.5 h-3.5 text-gray-400" />
                  const cheaper = diff > 0
                  return (
                    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${cheaper ? 'text-green-600' : 'text-yellow-500'}`}>
                      {cheaper ? '↓' : '↑'}{formatPrice(Math.abs(diff))}
                    </span>
                  )
                })()}
              </>
            ) : (
              <div className="text-base font-medium text-gray-500">~{formatPrice(order.expected_price)}</div>
            )}
          </div>
        </div>


        {/* Оплачено дочерью */}
        {!editing && showSettled && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-4 py-4">
              <div>
                <div className="font-medium text-gray-900">Дочь перевела деньги</div>
                <div className="text-sm text-gray-500">Долг погашен за этот товар</div>
              </div>
              <Switch
                checked={order.is_settled}
                onCheckedChange={v => applyUpdate({ is_settled: v })}
                disabled={saving}
              />
            </div>
          </div>
        )}

        {/* Данные заказа — просмотр */}
        {!editing && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
            {order.article && (
              <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                <span className="text-sm text-gray-500">Артикул</span>
                <ArticleChip article={order.article} />
              </div>
            )}
            {order.size && (
              <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                <span className="text-sm text-gray-500">Размер</span>
                <span className="inline-flex items-center gap-1 bg-violet-100 text-violet-700 text-xs font-medium px-2.5 py-1 rounded-full">
                  <Ruler className="w-3 h-3" />
                  {order.size}
                </span>
              </div>
            )}
            <ViewRow label="Ожидаемая цена" value={formatPrice(order.expected_price)} />
            {isOrdered && (
              <>
                <ViewRow label="Фактическая цена" value={order.actual_price != null ? formatPrice(order.actual_price) : null} />
                <ViewRow label="Аккаунт" value={order.account} />
                <ViewRow label="Дата доставки" value={order.delivery_date ? formatDate(order.delivery_date) : null} />
              </>
            )}
            {showReturnNum && (
              <ViewRow label="Номер возврата" value={order.return_number} />
            )}
            {order.ozon_url ? (
              <div className="flex items-start justify-between gap-4 py-2.5">
                <span className="text-sm text-gray-500 shrink-0">Ссылка на Ozon</span>
                <a
                  href={order.ozon_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-500 flex items-center gap-1"
                >
                  Открыть <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <ViewRow label="Ссылка на Ozon" value={null} />
            )}
          </div>
        )}

        {/* Данные заказа — редактирование */}
        {editing && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-4">
            <h2 className="font-semibold text-gray-900">Редактирование</h2>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="d-title">Название *</Label>
              <Input
                id="d-title"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className={formErrors.has('title') ? 'border-red-400 focus-visible:ring-red-400' : ''}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="d-article">Артикул</Label>
              <Input
                id="d-article"
                placeholder="1234567890"
                value={form.article}
                onChange={e => setForm(p => ({ ...p, article: e.target.value }))}
                inputMode="numeric"
                className="font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="d-size-edit">Размер</Label>
              <Input
                id="d-size-edit"
                placeholder="XL, 42, 10kg..."
                value={form.size}
                onChange={e => setForm(p => ({ ...p, size: e.target.value }))}
              />
            </div>

            {isOrdered ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="d-actual">Фактическая цена (₽) *</Label>
                  <Input
                    id="d-actual"
                    type="number"
                    inputMode="decimal"
                    placeholder="Сумма покупки"
                    value={form.actual_price}
                    onChange={e => setForm(p => ({ ...p, actual_price: e.target.value }))}
                    min="0"
                    step="0.01"
                    className={formErrors.has('actual_price') ? 'border-red-400 focus-visible:ring-red-400' : ''}
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <Label htmlFor="d-account">Аккаунт *</Label>
                    <AccountInput
                      id="d-account"
                      value={form.account}
                      onChange={v => setForm(p => ({ ...p, account: v }))}
                      className={formErrors.has('account') ? 'border-red-400 focus-visible:ring-red-400' : ''}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <Label htmlFor="d-date">Дата доставки</Label>
                    <Input
                      id="d-date"
                      type="date"
                      value={form.delivery_date}
                      onChange={e => setForm(p => ({ ...p, delivery_date: e.target.value }))}
                      className="text-base"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="d-expected">Ожидаемая цена (₽)</Label>
                <Input
                  id="d-expected"
                  type="number"
                  inputMode="decimal"
                  value={form.expected_price}
                  onChange={e => setForm(p => ({ ...p, expected_price: e.target.value }))}
                  min="0.01"
                  step="0.01"
                />
              </div>
            )}

            {showReturnNum && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="d-return-num">Номер возврата *</Label>
                <Input
                  id="d-return-num"
                  placeholder="Номер возврата Ozon"
                  value={form.return_number}
                  onChange={e => setForm(p => ({ ...p, return_number: e.target.value }))}
                  className={formErrors.has('return_number') ? 'border-red-400 focus-visible:ring-red-400' : ''}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="d-url">Ссылка на Ozon *</Label>
              <div className="flex gap-2">
                <Input
                  id="d-url"
                  type="url"
                  placeholder="https://ozon.ru/..."
                  value={form.ozon_url}
                  onChange={e => setForm(p => ({ ...p, ozon_url: e.target.value }))}
                  className={`flex-1${formErrors.has('ozon_url') ? ' border-red-400 focus-visible:ring-red-400' : ''}`}
                />
                {form.ozon_url && (
                  <a
                    href={form.ozon_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-12 px-3 flex items-center rounded-lg border-2 border-gray-200 text-blue-500"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Фото</Label>
              <ImageUpload
                value={form.image_url}
                onChange={v => setForm(p => ({ ...p, image_url: v }))}
              />
            </div>

            <Button size="lg" onClick={handleSave} disabled={saving} className="mt-1">
              {saving ? 'Сохраняем...' : 'Сохранить изменения'}
            </Button>
            <Button size="lg" variant="destructive" onClick={cancelEdit} disabled={saving} className="opacity-80">
              Отменить изменения
            </Button>
          </div>
        )}
      </div>

      {/* Sticky-бар перехода по статусу */}
      {!editing && availableTransitions.length > 0 && (() => {
        const primaryNext = availableTransitions.find(
          n => TRANSITION_VARIANTS[`${order.status}_${n}` as `${OrderStatus}_${OrderStatus}`] === 'default'
        ) ?? availableTransitions[0]
        const secondaryNexts = availableTransitions.filter(n => n !== primaryNext)
        const primaryKey = `${order.status}_${primaryNext}` as `${OrderStatus}_${OrderStatus}`
        const primaryLabel = TRANSITION_LABELS[primaryKey] ?? primaryNext
        const primaryVariant = TRANSITION_VARIANTS[primaryKey] ?? 'default'
        const primaryNeedsForm = !!TRANSITION_FIELDS[`${order.status}_${primaryNext}`]

        return (
          <div
            className="fixed left-0 right-0 px-4 pb-3 pt-10 bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent"
            style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
          >
            {secondaryNexts.length > 0 && (
              <div className="flex justify-center gap-6 mb-3">
                {secondaryNexts.map(next => {
                  const key = `${order.status}_${next}` as `${OrderStatus}_${OrderStatus}`
                  const label = TRANSITION_LABELS[key] ?? next
                  const isDestructive = TRANSITION_VARIANTS[key] === 'destructive'
                  return (
                    <button
                      key={next}
                      onClick={() => openTransition(next)}
                      disabled={saving}
                      className={`text-sm font-medium ${isDestructive ? 'text-red-500' : 'text-gray-500'}`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            )}
            <Button
              size="lg"
              variant={primaryVariant === 'destructive' ? 'destructive' : 'default'}
              className="w-full h-14 text-base font-semibold rounded-2xl shadow-lg"
              disabled={saving}
              onClick={() => openTransition(primaryNext)}
            >
              {primaryLabel}
              {primaryNeedsForm && <span className="ml-2 text-sm opacity-70">→</span>}
            </Button>
          </div>
        )
      })()}

      {/* Диалог перехода по статусу */}
      <Dialog open={pendingTransition !== null} onOpenChange={open => { if (!open && !saving) setPendingTransition(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{TRANSITION_DIALOG_TITLES[transitionKey] ?? 'Подтвердить переход'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-1">
            {pendingFields.includes('actual_price') && (
              <div className="flex flex-col gap-1.5">
                <Label>Фактическая цена (₽) *</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="Сумма покупки"
                  value={tForm.actual_price}
                  onChange={e => setTForm(p => ({ ...p, actual_price: e.target.value }))}
                  autoFocus
                  min="0"
                  step="0.01"
                  className={tErrors.has('actual_price') ? 'border-red-400 focus-visible:ring-red-400' : ''}
                />
              </div>
            )}
            {pendingFields.includes('account') && (
              <div className="flex flex-col gap-1.5">
                <Label>Аккаунт *</Label>
                <AccountInput
                  value={tForm.account}
                  onChange={v => setTForm(p => ({ ...p, account: v }))}
                  className={tErrors.has('account') ? 'border-red-400 focus-visible:ring-red-400' : ''}
                />
              </div>
            )}
            {pendingFields.includes('delivery_date') && (
              <div className="flex flex-col gap-1.5">
                <Label>Дата доставки *</Label>
                <Input
                  type="date"
                  value={tForm.delivery_date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={e => setTForm(p => ({ ...p, delivery_date: e.target.value }))}
                  className={`text-base${tErrors.has('delivery_date') ? ' border-red-400 focus-visible:ring-red-400' : ''}`}
                />
                {tErrors.has('delivery_date') && tForm.delivery_date && (
                  <p className="text-xs text-red-500">Дата не может быть в прошлом</p>
                )}
              </div>
            )}
            {pendingFields.includes('return_number') && (
              <div className="flex flex-col gap-1.5">
                <Label>Номер возврата *</Label>
                <Input
                  placeholder="Номер возврата Ozon"
                  value={tForm.return_number}
                  onChange={e => setTForm(p => ({ ...p, return_number: e.target.value }))}
                  autoFocus
                  className={tErrors.has('return_number') ? 'border-red-400 focus-visible:ring-red-400' : ''}
                />
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setPendingTransition(null)}
                disabled={saving}
              >
                Отмена
              </Button>
              <Button className="flex-1" onClick={confirmTransition} disabled={saving}>
                {saving ? 'Сохраняем...' : 'Подтвердить'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
