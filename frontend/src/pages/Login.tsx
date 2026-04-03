import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, FileText, Shield, Zap, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim()) return setError('Vui lòng nhập tên đăng nhập')
    if (!password) return setError('Vui lòng nhập mật khẩu')

    setLoading(true)
    try {
      const res = await api.post('/auth/login', { username, password })
      login(res.data.token, res.data.user)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không đúng')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex overflow-hidden bg-background">
      {/* ── Left brand ── */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 bg-gradient-to-br from-blue-950/60 via-background to-background border-r border-border relative overflow-hidden">
        {/* glow orbs */}
        <div className="absolute -top-40 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-lg">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-lg text-foreground">TamTin System</div>
              <div className="text-xs text-muted-foreground">Quản lý Hóa đơn Điện tử</div>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight mb-5">
            Hệ thống
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
              Quản lý Thuế
            </span>
            <br />
            Thông minh
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed mb-12">
            Nền tảng quản trị hóa đơn điện tử — tra cứu, kiểm tra và xuất báo cáo dữ liệu thuế nhanh chóng, chính xác.
          </p>

          {/* Features */}
          <div className="space-y-4">
            {[
              { icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Bảo mật đa lớp JWT' },
              { icon: BarChart3, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Xuất Excel tự động qua nhiều tháng' },
              { icon: Zap, color: 'text-violet-400', bg: 'bg-violet-500/10', label: 'Xử lý thời gian thực từ GDT' },
            ].map(({ icon: Icon, color, bg, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <span className="text-sm text-muted-foreground font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form ── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-in">
          <Card className="border-border/60 shadow-2xl shadow-black/40">
            <CardHeader className="pb-2">
              <div className="inline-flex items-center rounded-full border border-blue-800/50 bg-blue-500/10 px-3 py-0.5 text-xs font-semibold text-blue-400 w-fit mb-3">
                QUẢN TRỊ VIÊN
              </div>
              <h2 className="text-2xl font-bold text-foreground">Đăng nhập hệ thống</h2>
              <p className="text-sm text-muted-foreground">Nhập tài khoản nội bộ để truy cập</p>
            </CardHeader>

            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Tên đăng nhập</Label>
                  <Input
                    id="username"
                    placeholder="Nhập tên đăng nhập..."
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError('') }}
                    autoComplete="off"
                    className={error && !username ? 'border-destructive' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPw ? 'text' : 'password'}
                      placeholder="Nhập mật khẩu..."
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError('') }}
                      className={`pr-10 ${error && !password ? 'border-destructive' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">
                    <span className="shrink-0">✕</span>
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Đang đăng nhập...</>
                  ) : 'Đăng nhập'}
                </Button>
              </form>

              <p className="text-center text-xs text-muted-foreground mt-6">
                Hệ thống nội bộ — chỉ dành cho nhân viên được ủy quyền
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
