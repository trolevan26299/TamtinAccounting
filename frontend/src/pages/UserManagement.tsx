import { useState, useEffect, useCallback } from 'react'
import { UserPlus, Trash2, Lock, LockOpen, RefreshCw, Eye, EyeOff, ShieldCheck, User2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

interface SysUserItem {
  _id: string
  username: string
  fullName: string
  role: 'admin' | 'user'
  isActive: boolean
  lastLogin?: string
  createdAt: string
}

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—'

export default function UserManagement() {
  const [users, setUsers] = useState<SysUserItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Create dialog
  const [showCreate, setShowCreate] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<SysUserItem | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/users')
      setUsers(res.data)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Lỗi tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleCreate = async () => {
    if (!username.trim() || !password.trim()) {
      setCreateError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu')
      return
    }
    setCreateLoading(true)
    setCreateError('')
    try {
      await api.post('/users', { username: username.trim(), password, fullName: fullName.trim() })
      setShowCreate(false)
      setUsername(''); setFullName(''); setPassword('')
      fetchUsers()
    } catch (e: any) {
      setCreateError(e.response?.data?.message || 'Lỗi tạo người dùng')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleToggleLock = async (user: SysUserItem) => {
    try {
      await api.patch(`/users/${user._id}/toggle-lock`)
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isActive: !u.isActive } : u))
    } catch (e: any) {
      setError(e.response?.data?.message || 'Lỗi cập nhật trạng thái')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/users/${deleteTarget._id}`)
      setUsers(prev => prev.filter(u => u._id !== deleteTarget._id))
      setDeleteTarget(null)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Lỗi xóa người dùng')
      setDeleteTarget(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý người dùng</h1>
          <p className="text-sm text-muted-foreground mt-1">Thêm, khóa, hoặc xóa tài khoản người dùng</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4 mr-1.5', loading && 'animate-spin')} />
            Làm mới
          </Button>
          <Button size="sm" onClick={() => { setShowCreate(true); setCreateError('') }}>
            <UserPlus className="w-4 h-4 mr-1.5" /> Thêm người dùng
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm px-4 py-2.5 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Tổng tài khoản</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-3xl font-bold text-foreground">{users.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Đang hoạt động</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-3xl font-bold text-emerald-400">{users.filter(u => u.isActive).length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Đang bị khóa</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-3xl font-bold text-amber-400">{users.filter(u => !u.isActive).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-xs w-8">#</TableHead>
              <TableHead className="text-xs">Tên đăng nhập</TableHead>
              <TableHead className="text-xs">Họ tên</TableHead>
              <TableHead className="text-xs">Vai trò</TableHead>
              <TableHead className="text-xs">Trạng thái</TableHead>
              <TableHead className="text-xs">Đăng nhập lần cuối</TableHead>
              <TableHead className="text-xs">Ngày tạo</TableHead>
              <TableHead className="text-xs text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-sm">Đang tải...</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-sm">Chưa có người dùng nào</TableCell></TableRow>
            ) : users.map((user, idx) => (
              <TableRow key={user._id} className="border-border hover:bg-muted/20">
                <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {user.username[0].toUpperCase()}
                    </div>
                    <span className="font-mono text-sm font-medium text-foreground">{user.username}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{user.fullName}</TableCell>
                <TableCell>
                  {user.role === 'admin' ? (
                    <Badge className="bg-violet-500/15 text-violet-400 border-violet-500/30 gap-1 text-xs">
                      <ShieldCheck className="w-3 h-3" /> Admin
                    </Badge>
                  ) : (
                    <Badge className="bg-sky-500/15 text-sky-400 border-sky-500/30 gap-1 text-xs">
                      <User2 className="w-3 h-3" /> Người dùng
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {user.isActive ? (
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">Hoạt động</Badge>
                  ) : (
                    <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs">Đã khóa</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(user.lastLogin)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                <TableCell className="text-right">
                  {user.role !== 'admin' && (
                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="ghost" size="icon"
                        className={cn('h-7 w-7 text-muted-foreground hover:text-foreground', !user.isActive && 'text-amber-400 hover:text-amber-300')}
                        title={user.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                        onClick={() => handleToggleLock(user)}
                      >
                        {user.isActive ? <Lock className="w-3.5 h-3.5" /> : <LockOpen className="w-3.5 h-3.5" />}
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Xóa người dùng"
                        onClick={() => setDeleteTarget(user)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> Thêm người dùng mới
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {createError && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm px-3 py-2 rounded-lg">
                {createError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="new-username">Tên đăng nhập <span className="text-destructive">*</span></Label>
              <Input
                id="new-username" placeholder="vd: nguyenvana"
                value={username} onChange={e => setUsername(e.target.value.toLowerCase())}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-fullname">Họ và tên</Label>
              <Input
                id="new-fullname" placeholder="vd: Nguyễn Văn A"
                value={fullName} onChange={e => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">Mật khẩu <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="new-password" type={showPwd ? 'text' : 'password'}
                  placeholder="Tối thiểu 6 ký tự"
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Tài khoản mới sẽ có vai trò <strong>Người dùng</strong> — chỉ có thể tra cứu hóa đơn.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={createLoading}>
              {createLoading ? 'Đang tạo...' : 'Tạo tài khoản'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa tài khoản</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa tài khoản{' '}
              <strong className="text-foreground">{deleteTarget?.username}</strong>?{' '}
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Xóa tài khoản
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
