# Cloudflare Worker - thamdinhap

Worker này xử lý upload/download file lên Cloudflare R2 bucket "thamdinh".

## Cài đặt

```bash
cd worker
npm install
```

## Deploy Worker

1. **Đăng nhập Cloudflare:**
```bash
npx wrangler login
```

2. **Kiểm tra R2 bucket đã tồn tại:**
```bash
npx wrangler r2 bucket list
```

3. **Tạo R2 bucket (nếu chưa có):**
```bash
npx wrangler r2 bucket create thamdinh
```

4. **Deploy worker:**
```bash
npm run deploy
```

## API Endpoints

Worker sẽ được deploy tại: `https://thamdinhap.<your-subdomain>.workers.dev`

### Upload file
```
POST /upload
Content-Type: multipart/form-data

Body:
- file: File to upload
- key: (optional) Custom file key
```

Response:
```json
{
  "success": true,
  "key": "1702123456789-abc123-filename.pdf",
  "url": "/file/1702123456789-abc123-filename.pdf",
  "name": "filename.pdf",
  "size": 12345,
  "type": "application/pdf"
}
```

### Download file
```
GET /file/:key
```

### Delete file
```
DELETE /file/:key
```

### List files
```
GET /list
```

## Cấu hình CORS

Worker đã được cấu hình để cho phép CORS từ mọi origin. Điều này cho phép frontend gọi API từ localhost hoặc bất kỳ domain nào.

## Local Development

```bash
npm run dev
```

Worker sẽ chạy tại `http://localhost:8787`
