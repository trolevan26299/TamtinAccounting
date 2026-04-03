import { useNavigate } from 'react-router-dom'
import { ShieldX, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Unauthorized() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-12 h-12 text-destructive" />
        </div>
        <h1 className="text-6xl font-extrabold text-destructive mb-2">401</h1>
        <h2 className="text-2xl font-bold text-foreground mb-3">Không có quyền truy cập</h2>
        <p className="text-muted-foreground mb-8">
          Bạn không có quyền truy cập trang này.<br />
          Chức năng này chỉ dành cho quản trị viên.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
          </Button>
          <Button onClick={() => navigate('/dashboard')}>
            Về trang chính
          </Button>
        </div>
      </div>
    </div>
  )
}
