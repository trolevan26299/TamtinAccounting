# TamTin - Hệ thống Quản lý Hóa đơn Điện tử

## Cấu trúc dự án

```
TamTinCrawBillTax/
├── backend/          ← NestJS API
├── frontend/         ← React + Vite
├── docker-compose.yml ← Orchestrator kéo sẵn Docker Image từ Docker Hub
└── .github/workflows/deploy.yml ← Cấu hình CI/CD tự động (Build Docker Hub -> Server Pull)
```

## Hướng dẫn Triển khai (CI/CD Chuẩn Doanh Nghiệp qua Docker Hub & Github Action)

Hệ thống CI/CD đã được cấu trúc lại cho chuyên nghiệp, bắt chước giống hệt phương pháp bạn đang dùng ở các project Nginx khác trên server Ubuntu của bạn.

### 1. Chuẩn bị biến môi trường (Secrets) trên Github
Trên kho lưu trữ tài khoản Github chứa code này, bạn thao tác: **Settings -> Secrets and variables -> Actions -> Cài đặt những khóa (New repository secret)** sau đây:

- `DOCKERHUB_USERNAME`: Tên tài khoản Docker Hub của bạn (VD: `trolevan26299`).
- `DOCKERHUB_PASSWORD`: Nhập thẳng mật khẩu tài khoản Docker Hub của bạn.
- `SSH_HOST`: IP máy chủ Ubuntu VPS của bạn (`116.118...`).
- `SSH_PORT`: `22`.
- `SSH_USERNAME`: `root` (theo CLI của bạn, hoặc user được cấu hình riêng).
- `SSH_PASSWORD` hoặc `SSH_PRIVATE_KEY`: Mật khẩu / mã khóa truy cập VPS của user.

### 2. Luồng CI/CD diễn ra "Tự động" như thế nào?

Bình thường bạn chỉ việc Dev dưới Local -> `git push origin main`.
Hệ thống mạng Github Action sẽ nhúng tay can thiệp:
1. **Dorny Paths-Filter:** Nếu bạn chỉ code gõ ở thư mục `frontend/`, nó chỉ ra lệnh cỗ máy ảo Github Build Frontend. Ngược lại với mảng Backend. (Giảm tải băng thông và sức mạnh server vô ích).
2. **Docker Build & Push:** Máy trạm ảo của GitHub sẽ đọc các file `Dockerfile` đã chuẩn bị sẵn để nén code thành bộ cục Image rồi tống sạch lên Docker Hub cá nhân của bạn dưới dạng tên public ví dụ `trolevan26299/tamtin-frontend:latest`
3. **Appleboy SSH Action:** Action lúc này gọi API tự kích hoạt SSH gõ lệnh đăng nhập thẳng màn hình CLI Ubuntu Server của bạn, chuyển hướng cd vào thư mục setup dự án (Bạn cần chỉnh tay đoạn `cd /root/...` trong file deploy.yml cho đúng thư mục dự án) rồi tự gõ lệnh:
  ```bash
  docker-compose pull
  docker-compose up -d
  ```

### 3. Server Gánh Nhẹ Mọi Việc
Bằng CI/CD trên, con VPS Ubuntu 22.04 LTS (14% RAM Memory / 183 Processes) của bạn bây giờ **KHÔNG CẦN TỐN SỨC LOAD/BUILD ỨNG DỤNG LẠI TỪ ĐẦU (NHƯ NODEJS HAY NPM INSTALL)**, tránh được nguy cơ đột quỵ tràn RAM. Máy bạn chỉ cần tải nhẹ package ảnh Docker về và Restart Node Container!


## Hướng dẫn đẩy Code (Lần đầu Tiên) lên Github

Hiện tại source code mới chỉ nằm ở Local (máy tính của bạn). Hãy thực hiện đẩy (Push) trọn gói bộ Code + Dockerfile + Github Actions vừa rèn này lên một Kho lưu trữ mới trên Github của bạn nhé:


Mở Terminal tại thư mục `TamTinCrawBillTax`, gõ lần lượt:
```bash
git init
git add .
git commit -m "🚀 Khởi tạo hệ thống TamTin - Kèm Docker CI/CD cấu trúc mới"
git branch -M main
git remote add origin https://github.com/TaikhoanCuaBan/TenKhoRepositoryCuaBan.git
git push -u origin main
```
> Nhớ tạo một repository trắng (Private) trên Github trước mang tên gì đó tuỳ bạn rổi copy URL thay thế vào dòng `origin` nhé!

---
## Tài khoản đăng nhập hệ thống nội bộ (Mặc định khi build mới)
- **Username:** `admin`
- **Password:** `AdminPassword123`
*(Role mặc định: admin - bạn nên đăng nhập và đổi mật khẩu hoặc tạo user mới)*

## API Endpoints (Backend :3001)

| Method | Path | Mô tả |
|--------|------|-------|
| POST | /api/auth/login | Đăng nhập hệ thống |
| GET | /api/auth/me | Thông tin user hiện tại |
| GET | /api/gdt/captcha | Lấy captcha từ GDT |
| POST | /api/gdt/login | Đăng nhập GDT |
| POST | /api/invoices/search | Tra cứu hóa đơn (phân trang) |
| POST | /api/invoices/export | Xuất Excel |

## Luồng sử dụng

1. Truy cập `http://localhost:3000` (hoặc IP Server Port 3000)
2. Đăng nhập hệ thống (Sử dụng tài khoản admin khởi tạo)
3. Vào **Tra cứu hóa đơn** trong sidebar
4. Nhập MST + Mật khẩu hệ thống Thuế (GDT) + captcha → **Kết nối GDT**
5. Chọn loại HĐ, ngày → **Tìm kiếm** hoặc **Xuất Excel**
   - Nếu khoảng thời gian > 10 ngày, hệ thống Backend sẽ tự động chia nhỏ request để lấy trọn vẹn dữ liệu từ Thuế.
