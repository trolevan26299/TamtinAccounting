# --- Stage 1: Build phần mềm Vite/React ---
FROM node:20-alpine AS builder

WORKDIR /app

# Khai báo môi trường để vite build cho production
# Nếu project cần biến môi trường (ví dụ VITE_API_URL), bạn có thể định nghĩa trong .env ở server
COPY package*.json ./
RUN npm install

COPY . .

# Build code (sinh ra thư mục /app/dist)
RUN npm run build

# --- Stage 2: Serve bằng Nginx ---
FROM nginx:alpine

# Xóa trang web mặc định của Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copy build từ Stage 1 sang web root của Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy file cấu hình Nginx để hỗ trợ tính năng SPA React-Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose Nginx public port
EXPOSE 80

# Chạy server
CMD ["nginx", "-g", "daemon off;"]
