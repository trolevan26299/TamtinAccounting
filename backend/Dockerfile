FROM node:20-alpine

WORKDIR /app

# Khai báo biến môi trường cho quá trình build
ARG PORT=3001
ENV PORT=${PORT}

# Copy package.json và cài đặt dependencies
COPY package*.json ./
RUN npm install

# Copy toàn bộ mã nguồn
COPY . .

# Build ứng dụng NestJS
RUN npm run build

# Expose port (tương ứng với biến process.env.PORT)
EXPOSE ${PORT}

# Chạy ứng dụng production
CMD ["node", "dist/main"]
