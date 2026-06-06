# 🏓 GOLAB Pickleball Standalone

Hệ thống quản lý giải đấu Pickleball GOLAB — hoàn toàn độc lập.

**Live:** https://golabpickeball.armsss.online

## Cấu trúc

```
golab-pickleball-standalone/
├── apps/
│   ├── api/        NestJS API (port 3021) — JWT auth + tournament state
│   └── web/        Next.js frontend (port 3020) — Trang giải đấu all-in-one
└── packages/
    └── db/         Prisma schema (chỉ bảng key_value_pairs)
```

## Khởi động local

```bash
# 1. Cài dependencies
pnpm install

# 2. Tạo DB & generate Prisma client
cd packages/db
cp ../../apps/api/.env.example ../../apps/api/.env
# Sửa DATABASE_URL trong apps/api/.env
pnpm db:push
pnpm db:generate

# 3. Chạy API (terminal 1)
pnpm dev:api

# 4. Chạy Web (terminal 2)
pnpm dev:web
```

## Deploy lên server (Oracle)

```bash
cd /home/opc/golab-pickleball-standalone
git pull origin main
pnpm install
cd packages/db && pnpm db:generate && cd ../..
pnpm build:api
pnpm build:web
pm2 restart pickleball-api pickleball-web
```

## Biến môi trường

Tạo file `.env` trong `apps/api/`:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/pickleball_db
API_PORT=3021
PICKLEBALL_ADMIN_PASSWORD=golab2026
PICKLEBALL_JWT_SECRET=your-secret-key
```

## API Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/api/pickleball-state` | Lấy trạng thái giải đấu (public) |
| POST | `/api/pickleball-state` | Lưu trạng thái (cần Bearer token) |
| POST | `/api/pickleball-login` | Đăng nhập admin, trả về JWT + refresh token |
| POST | `/api/pickleball-refresh` | Làm mới access token |
| POST | `/api/pickleball-logout` | Đăng xuất (thu hồi refresh token) |
