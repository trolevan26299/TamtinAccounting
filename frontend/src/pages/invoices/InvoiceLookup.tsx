import { useState, useCallback } from 'react'
import {
  RefreshCw, Shield, Search, Download, ChevronLeft, ChevronRight,
  Eye, EyeOff, Loader2, Calendar as CalendarIcon, Plus, X, CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import api from '@/lib/api'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { DateRange } from 'react-day-picker'
import { cn, formatVND, formatDate, getTrangThai } from '@/lib/utils'

// ─── Types ───
interface Invoice {
  shdon: number; khhdon: string; khmshdon?: string | number; tdlap: string
  nbmst?: string; nbten: string; nmmst: string; nmten: string; nmtnmua?: string
  tgtcthue: number; tgtthue: number; tgtttbso: number
  thtttoan: string; ladhddt: number; tthai: number
}
interface SearchResult {
  datas: Invoice[]; total: number; state: string | null
}
interface TabState {
  id: string
  gdtToken: string | null
  gdtUsername: string | null
  direction: 'ban-ra' | 'mua-vao'
  loaiHD: string            // 'mtt' | 'ddt'  (chỉ dùng cho ban-ra)
  dateRange: DateRange | undefined
  results: SearchResult | null
  currentPage: number
  pageStates: (string | null)[]   // for ban-ra cursor-based
  pageOffset: number              // for mua-vao offset-based
  searchLoading: boolean
  exportLoading: boolean
  searchError: string
}

// ─── Helpers ───
const newTab = (id: string): TabState => ({
  id,
  gdtToken: null,
  gdtUsername: null,
  direction: 'ban-ra',
  loaiHD: 'mtt',
  dateRange: (() => { const from = new Date(); from.setDate(1); return { from, to: new Date() } })(),
  results: null,
  currentPage: 1,
  pageStates: [null],
  pageOffset: 0,
  searchLoading: false,
  exportLoading: false,
  searchError: '',
})

// ─── DatePicker ───
function DatePickerWithRange({ date, setDate, disabled }: {
  date: DateRange | undefined
  setDate: (d: DateRange | undefined) => void
  disabled?: boolean
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-8 px-3 text-sm justify-start text-left font-normal border-input bg-background hover:bg-accent",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
          {date?.from ? (
            date.to ? (
              <>{format(date.from, "dd/MM/yyyy", { locale: vi })} – {format(date.to, "dd/MM/yyyy", { locale: vi })}</>
            ) : format(date.from, "dd/MM/yyyy", { locale: vi })
          ) : <span>Chọn khoảng thời gian</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={date?.from}
          selected={date}
          onSelect={setDate}
          numberOfMonths={2}
          locale={vi}
        />
      </PopoverContent>
    </Popover>
  )
}

// ─── GDT Connect Panel (compact, inside tab) ───
function GdtLoginPanel({ onConnected }: { onConnected: (token: string, user: string) => void }) {
  const [gdtUser, setGdtUser] = useState('')
  const [gdtPass, setGdtPass] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [captchaKey, setCaptchaKey] = useState('')
  const [captchaSvg, setCaptchaSvg] = useState('')
  const [captchaVal, setCaptchaVal] = useState('')
  const [captchaLoading, setCaptchaLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadCaptcha = async () => {
    setCaptchaLoading(true); setCaptchaSvg(''); setCaptchaVal('')
    try {
      const res = await api.get('/gdt/captcha')
      setCaptchaKey(res.data.key); setCaptchaSvg(res.data.content)
    } catch { setError('Không tải được captcha') } finally { setCaptchaLoading(false) }
  }

  const handleConnect = async () => {
    setError('')
    if (!gdtUser || !gdtPass || !captchaVal || !captchaKey) return setError('Vui lòng điền đầy đủ')
    setLoading(true)
    try {
      const res = await api.post('/gdt/login', { username: gdtUser, password: gdtPass, cvalue: captchaVal, ckey: captchaKey })
      if (res.status === 200 && res.data.token) {
        onConnected(res.data.token, gdtUser)
      } else {
        setError(res.data.message || 'Đăng nhập GDT thất bại')
        loadCaptcha()
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Lỗi kết nối GDT')
      loadCaptcha()
    } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full py-16">
      <Card className="w-full max-w-md border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" /> Kết nối GDT cho tab này
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">MST / Tên đăng nhập</Label>
              <Input placeholder="Mã số thuế..." value={gdtUser} onChange={e => { setGdtUser(e.target.value); setError('') }} spellCheck={false} className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Mật khẩu GDT</Label>
              <div className="relative">
                <Input type={showPw ? 'text' : 'password'} placeholder="Mật khẩu..." value={gdtPass} onChange={e => { setGdtPass(e.target.value); setError('') }} className="h-8 text-sm pr-8" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Mã xác nhận (Captcha)</Label>
            <div className="flex gap-2">
              <div className="h-8 flex-1 rounded-md border border-input bg-white/5 flex items-center justify-center overflow-hidden px-1">
                {captchaLoading
                  ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  : captchaSvg
                    ? <div className="w-full h-full flex items-center justify-center [&_svg]:w-full [&_svg]:h-7 [&_svg]:filter [&_svg]:invert" dangerouslySetInnerHTML={{ __html: captchaSvg }} />
                    : <span className="text-xs text-muted-foreground">Nhấn tải captcha</span>
                }
              </div>
              <Button type="button" variant="outline" size="icon" onClick={loadCaptcha} title="Tải lại captcha" className="h-8 w-8 shrink-0 hover:rotate-180 transition-transform duration-300">
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
              <Input placeholder="Nhập mã..." value={captchaVal} onChange={e => { setCaptchaVal(e.target.value); setError('') }} maxLength={10} className="w-28 h-8 text-sm font-mono tracking-widest" spellCheck={false} />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
              <span>✕</span> {error}
            </div>
          )}

          <Button onClick={handleConnect} disabled={loading} className="w-full">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang kết nối...</> : <><Shield className="w-4 h-4" /> Kết nối GDT</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Single Tab Panel ───
function TabPanel({ tab, onUpdate }: {
  tab: TabState
  onUpdate: (id: string, patch: Partial<TabState>) => void
}) {
  const update = useCallback((patch: Partial<TabState>) => onUpdate(tab.id, patch), [tab.id, onUpdate])

  const fromDate = tab.dateRange?.from ? format(tab.dateRange.from, 'yyyy-MM-dd') : ''
  const toDate = tab.dateRange?.to ? format(tab.dateRange.to, 'yyyy-MM-dd') : ''
  const totalPages = tab.results ? Math.ceil(tab.results.total / 50) : 0
  const isMuaVao = tab.direction === 'mua-vao'

  const handleSearch = async (page = 1, stateStr?: string | null, offset = 0) => {
    update({ searchError: '' })
    if (!tab.gdtToken) return update({ searchError: 'Vui lòng kết nối GDT trước' })
    if (!fromDate || !toDate) return update({ searchError: 'Vui lòng chọn khoảng thời gian' })

    update({ searchLoading: true })
    try {
      if (isMuaVao) {
        // Offset-based pagination for purchase
        const res = await api.post('/invoices/search-purchase', {
          gdtToken: tab.gdtToken, fromDate, toDate, loaiHD: tab.loaiHD, pageOffset: offset,
        })
        if (res.data.gdtExpired) {
          update({ gdtToken: null, gdtUsername: null, searchError: 'Token GDT đã hết hạn, vui lòng đăng nhập lại' })
          return
        }
        update({ results: res.data, currentPage: page, pageOffset: offset })
      } else {
        // Cursor-based pagination for sold (ban-ra)
        const res = await api.post('/invoices/search', {
          gdtToken: tab.gdtToken, fromDate, toDate, loaiHD: tab.loaiHD, state: stateStr ?? null,
        })
        if (res.data.gdtExpired) {
          update({ gdtToken: null, gdtUsername: null, searchError: 'Token GDT đã hết hạn, vui lòng đăng nhập lại' })
          return
        }
        const newPageStates = [...tab.pageStates]
        newPageStates[page] = res.data.state
        update({ results: res.data, currentPage: page, pageStates: newPageStates })
      }
    } catch (err: any) {
      update({ searchError: err.response?.data?.error || err.response?.data?.message || 'Lỗi tra cứu hóa đơn' })
    } finally {
      update({ searchLoading: false })
    }
  }

  const handleExport = async () => {
    if (!tab.gdtToken) return update({ searchError: 'Vui lòng kết nối GDT trước' })
    update({ exportLoading: true, searchError: '' })
    try {
      const endpoint = isMuaVao ? '/invoices/export-purchase' : '/invoices/export'
      const body = isMuaVao
        ? { gdtToken: tab.gdtToken, fromDate, toDate, loaiHD: tab.loaiHD, mst: tab.gdtUsername }
        : { gdtToken: tab.gdtToken, fromDate, toDate, loaiHD: tab.loaiHD, mst: tab.gdtUsername }
      const res = await api.post(endpoint, body, { responseType: 'blob' })
      const disposition = res.headers['content-disposition'] || ''
      const match = disposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/)
      const filename = match ? decodeURIComponent(match[1]) : isMuaVao ? 'HoaDonMuaVao.xlsx' : 'HoaDon.xlsx'
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url; a.download = filename; a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      let msg = err.message
      if (err.response?.data instanceof Blob) {
        msg = await err.response.data.text().then((t: string) => {
          try { return JSON.parse(t).error || JSON.parse(t).message || msg } catch { return msg }
        })
      } else if (err.response?.data?.error) {
        msg = err.response.data.error
      }
      update({ searchError: 'Lỗi xuất Excel: ' + msg })
    } finally {
      update({ exportLoading: false })
    }
  }

  // ─── Not connected: show login ───
  if (!tab.gdtToken) {
    return <GdtLoginPanel onConnected={(token, user) => update({ gdtToken: token, gdtUsername: user })} />
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Filter bar ── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60 bg-muted/20 shrink-0 flex-wrap">
        {/* Connected badge */}
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md shrink-0">
          <CheckCircle2 className="w-3 h-3" />
          <span className="font-mono font-medium">{tab.gdtUsername}</span>
        </div>

        {/* Direction filter - Bán ra / Mua vào */}
        <div className="flex items-center rounded-md border border-border overflow-hidden shrink-0">
          <button
            onClick={() => update({ direction: 'ban-ra', results: null, currentPage: 1, pageStates: [null], pageOffset: 0 })}
            className={cn(
              'px-3 py-1.5 text-xs font-medium transition-colors',
              tab.direction === 'ban-ra'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent'
            )}
          >Hóa đơn bán ra</button>
          <button
            onClick={() => update({ direction: 'mua-vao', results: null, currentPage: 1, pageStates: [null], pageOffset: 0 })}
            className={cn(
              'px-3 py-1.5 text-xs font-medium transition-colors border-l border-border',
              tab.direction === 'mua-vao'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent'
            )}
          >Hóa đơn mua vào</button>
        </div>

        {/* Loại HĐ — hiện cả hai hướng */}
        <Select
          value={tab.loaiHD}
          onValueChange={v => update({ loaiHD: v })}
          disabled={tab.searchLoading || tab.exportLoading}
        >
          <SelectTrigger className="h-8 text-xs w-[200px] shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mtt">Khởi tạo từ máy tính tiền</SelectItem>
            <SelectItem value="ddt">Hóa đơn điện tử</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Range */}
        <DatePickerWithRange
          date={tab.dateRange}
          setDate={d => update({ dateRange: d })}
          disabled={tab.searchLoading || tab.exportLoading}
        />

        {/* Actions */}
        <Button
          size="sm"
          className="h-8 shrink-0"
          onClick={() => { update({ results: null, currentPage: 1, pageStates: [null], pageOffset: 0 }); handleSearch(1, null, 0) }}
          disabled={tab.searchLoading || tab.exportLoading}
        >
          {tab.searchLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          <span className="ml-1.5">{tab.searchLoading ? 'Đang tìm...' : 'Tìm kiếm'}</span>
        </Button>

        <Button
          size="sm"
          variant="success"
          className="h-8 shrink-0"
          onClick={handleExport}
          disabled={tab.exportLoading || tab.searchLoading}
        >
          {tab.exportLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          <span className="ml-1.5">{tab.exportLoading ? 'Đang xuất...' : 'Xuất Excel'}</span>
        </Button>

        {/* Disconnet */}
        <button
          onClick={() => update({ gdtToken: null, gdtUsername: null, results: null, currentPage: 1, pageStates: [null], pageOffset: 0 })}
          className="ml-auto text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors shrink-0"
        >
          <X className="w-3 h-3" /> Ngắt kết nối
        </button>
      </div>

      {/* ── Error bar ── */}
      {tab.searchError && (
        <div className="mx-4 mt-2 flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive shrink-0">
          <span>✕</span> {tab.searchError}
        </div>
      )}

      {/* ── Export progress bar ── */}
      {tab.exportLoading && (
        <div className="mx-4 mt-2 flex items-center gap-3 rounded-lg bg-emerald-500/5 border border-emerald-800/40 px-3 py-2.5 shrink-0">
          <Download className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="flex-1">
            <div className="text-xs font-semibold text-emerald-400">Đang xuất dữ liệu...</div>
            <div className="text-[11px] text-muted-foreground">Có thể mất vài phút nếu khoảng thời gian lớn</div>
          </div>
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400 shrink-0" />
        </div>
      )}

      {/* ── Table (scrollable) ── */}
      <div className="flex-1 overflow-auto">
        {tab.results && tab.results.datas.length > 0 ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-12 text-center text-xs whitespace-nowrap">STT</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">MST</TableHead>
                    <TableHead className="text-center text-xs whitespace-nowrap">Ký hiệu<br />mẫu số</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">Ký hiệu<br />hóa đơn</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">Số HĐ</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">Ngày lập</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">Thông tin hóa đơn</TableHead>
                    <TableHead className="text-right text-xs whitespace-nowrap">Chưa thuế</TableHead>
                    <TableHead className="text-right text-xs whitespace-nowrap">Tiền thuế</TableHead>
                    <TableHead className="text-right text-xs whitespace-nowrap">Thanh toán</TableHead>
                    <TableHead className="text-center text-xs whitespace-nowrap">Loại</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tab.results.datas.map((inv, idx) => (
                    <TableRow key={`${inv.shdon}-${idx}`} className="hover:bg-muted/20">
                      <TableCell className="text-muted-foreground text-center text-xs">{(tab.currentPage - 1) * 50 + idx + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{isMuaVao ? (inv.nbmst || '—') : (inv.nbmst || '—')}</TableCell>
                      <TableCell className="font-mono text-xs text-center">{inv.khmshdon || '1'}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{inv.khhdon}</TableCell>
                      <TableCell className="font-mono font-semibold text-sm">{inv.shdon}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{formatDate(inv.tdlap)}</TableCell>
                      <TableCell className="min-w-[260px]">
                        <div className="flex flex-col gap-0.5 text-[11px] leading-relaxed text-muted-foreground">
                          {isMuaVao ? (
                            <>
                              {inv.nbmst && <div>MST người bán: <span className="font-mono text-foreground font-medium">{inv.nbmst}</span></div>}
                              {inv.nbten && <div>Tên người bán: <span className="text-foreground">{inv.nbten}</span></div>}
                            </>
                          ) : (
                            <>
                              {inv.nmmst && <div>MST người mua: <span className="font-mono text-foreground font-medium">{inv.nmmst}</span></div>}
                              {(inv.nmten || inv.nmtnmua) && <div>Tên người mua: <span className="text-foreground">{inv.nmten || inv.nmtnmua}</span></div>}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">{formatVND(inv.tgtcthue)}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-amber-500/90">{formatVND(inv.tgtthue)}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold text-emerald-400">{formatVND(inv.tgtttbso)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={inv.ladhddt === 1 ? 'secondary' : 'outline'} className="text-[10px] px-1.5 py-0">
                          {inv.ladhddt === 1 ? 'MTT' : 'ĐT'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={inv.tthai === 1 ? 'outline' : 'secondary'} className={cn("text-[10px] whitespace-nowrap", inv.tthai === 1 && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20")}>
                          {getTrangThai(inv.tthai)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination — sticky bottom */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-background shrink-0">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => {
                  const p = tab.currentPage - 1
                  if (isMuaVao) {
                    const newOffset = (p - 1) * 50
                    handleSearch(p, null, newOffset)
                  } else {
                    handleSearch(p, tab.pageStates[p - 1])
                  }
                }} disabled={tab.currentPage <= 1 || tab.searchLoading}>
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Trước
                </Button>
                <span className="text-xs text-muted-foreground">
                  Trang <strong className="text-foreground">{tab.currentPage}</strong> / {totalPages}
                  &nbsp;·&nbsp; {tab.results.total.toLocaleString('vi-VN')} hóa đơn
                </span>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => {
                  const p = tab.currentPage + 1
                  if (isMuaVao) {
                    handleSearch(p, null, tab.pageOffset + 50)
                  } else {
                    handleSearch(p, tab.pageStates[tab.currentPage])
                  }
                }} disabled={tab.currentPage >= totalPages || (!isMuaVao && !tab.pageStates[tab.currentPage]) || tab.searchLoading}>
                  Tiếp <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            )}
          </div>
        ) : tab.results && tab.results.datas.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Không tìm thấy hóa đơn nào trong khoảng thời gian này
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Chọn điều kiện và nhấn <strong className="mx-1 text-foreground">Tìm kiếm</strong> để bắt đầu
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ───
let tabCounter = 1

export default function InvoiceLookup() {
  const [tabs, setTabs] = useState<TabState[]>([newTab('tab-1')])
  const [activeTab, setActiveTab] = useState('tab-1')

  const updateTab = useCallback((id: string, patch: Partial<TabState>) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
  }, [])

  const addTab = () => {
    if (tabs.length >= 8) return
    tabCounter++
    const id = `tab-${tabCounter}`
    setTabs(prev => [...prev, newTab(id)])
    setActiveTab(id)
  }

  const closeTab = (id: string) => {
    if (tabs.length === 1) return // keep at least 1
    setTabs(prev => {
      const next = prev.filter(t => t.id !== id)
      if (activeTab === id) setActiveTab(next[next.length - 1].id)
      return next
    })
  }

  const activeTabData = tabs.find(t => t.id === activeTab)!

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Page header ── */}
      <div className="px-6 pt-5 pb-3 border-b border-border/60 bg-background shrink-0">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Tra cứu hóa đơn điện tử</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Kết nối GDT và tra cứu hóa đơn theo ngày lập — hỗ trợ nhiều tài khoản</p>
          </div>
        </div>
      </div>

      {/* ── Browser-style Tab bar ── */}
      <div className="flex items-end gap-0 px-4 pt-2 bg-muted/20 border-b border-border/60 shrink-0 overflow-x-auto">
        {tabs.map(tab => {
          const isActive = tab.id === activeTab
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "group flex items-center gap-2 min-w-[140px] max-w-[220px] h-9 px-3 text-xs rounded-t-lg cursor-pointer transition-colors border-t border-x select-none shrink-0",
                isActive
                  ? "bg-background border-border/60 text-foreground border-b-0 -mb-px z-10"
                  : "bg-transparent border-transparent text-muted-foreground hover:bg-background/50 hover:text-foreground"
              )}
            >
              {tab.gdtToken ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              ) : (
                <Shield className="w-3 h-3 text-muted-foreground shrink-0" />
              )}
              <span className="flex-1 truncate font-medium">
                {tab.gdtUsername || `Tab ${tabs.indexOf(tab) + 1}`}
              </span>
              {tabs.length > 1 && (
                <button
                  onClick={e => { e.stopPropagation(); closeTab(tab.id) }}
                  className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )
        })}

        {/* Add tab button */}
        {tabs.length < 8 && (
          <button
            onClick={addTab}
            className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background/50 rounded-t-lg transition-colors shrink-0 ml-1"
            title="Thêm tab mới"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Active Tab Content ── */}
      <div className="flex-1 overflow-hidden">
        <TabPanel key={activeTab} tab={activeTabData} onUpdate={updateTab} />
      </div>
    </div>
  )
}
