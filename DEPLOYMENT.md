# Lulala 项目部署指南

## 项目架构说明

本项目采用前后端分离架构：
- **前端**：Next.js 14（纯客户端渲染）
- **后端**：PHP（位于 `/backend` 目录）

**重要发现**：本项目虽然使用 Next.js，但实际上所有页面都是客户端渲染（`'use client'`），没有使用 SSR/SSG 特性，因此**可以直接部署到 nginx，无需 Node.js 运行时**！

---

## 方案一：纯静态部署到 nginx（推荐）⭐

### 优点
- ✅ 无需 Node.js 运行时
- ✅ nginx 直接托管静态文件，性能最佳
- ✅ 部署简单，维护成本低
- ✅ 适合传统服务器环境

### 部署步骤

#### 1. 构建前端静态文件

```bash
# 安装依赖
npm install

# 构建静态文件（会生成 out 目录）
npm run build

# 查看生成的文件
ls -la out/
```

#### 2. 上传到服务器

```bash
# 方式1：使用 rsync
rsync -avz --exclude 'node_modules' --exclude '.git' ./ user@your-server:/var/www/lulalanew/

# 方式2：使用 scp
scp -r ./out user@your-server:/var/www/lulalanew/
scp -r ./backend user@your-server:/var/www/lulalanew/
```

#### 3. 配置 nginx

```bash
# 复制配置文件
sudo cp nginx.conf.example /etc/nginx/sites-available/lulalanew

# 编辑配置，修改域名和路径
sudo nano /etc/nginx/sites-available/lulalanew

# 创建软链接启用站点
sudo ln -s /etc/nginx/sites-available/lulalanew /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 nginx
sudo systemctl reload nginx
```

#### 4. 配置 PHP-FPM（如果后端在同一服务器）

```bash
# 确保 PHP-FPM 正在运行
sudo systemctl status php-fpm  # 或 php8.1-fpm，根据版本

# 设置目录权限
sudo chown -R www-data:www-data /var/www/lulalanew
sudo chmod -R 755 /var/www/lulalanew
```

#### 5. 测试访问

```bash
# 访问你的域名
http://your-domain.com

# 测试 API
curl http://your-domain.com/v1/xxx
```

---

## 方案二：Node.js + nginx 反向代理

如果将来需要使用 SSR 特性，可以采用此方案。

### 部署步骤

#### 1. 修改 `next.config.js`

```javascript
// 移除或注释掉 output: 'export'
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'rs.debot.ai'],
  },
  async rewrites() {
    return [
      {
        source: '/v1/:path*',
        destination: 'http://lulala.ju4.com/v1/:path*',
      },
    ]
  },
  // ... 其他配置
}
```

#### 2. 使用 PM2 管理进程

```bash
# 安装 PM2
npm install -g pm2

# 构建
npm run build

# 启动
pm2 start npm --name "lulalanew" -- start

# 设置开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status
pm2 logs lulalanew
```

#### 3. nginx 配置为反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 方案对比

| 特性 | 方案一（静态+nginx） | 方案二（Node.js+nginx） |
|------|---------------------|------------------------|
| 是否需要 Node.js | ❌ 不需要 | ✅ 需要 |
| 性能 | ⭐⭐⭐⭐⭐ 最快 | ⭐⭐⭐⭐ 快 |
| 资源占用 | ⭐⭐⭐⭐⭐ 极低 | ⭐⭐⭐ 中等 |
| 维护成本 | ⭐⭐⭐⭐⭐ 低 | ⭐⭐⭐ 中等 |
| 支持 SSR | ❌ | ✅ |
| 支持 API Routes | ❌ | ✅ |
| 支持 rewrites | ❌（需 nginx 配置） | ✅ |
| 图片优化 | ❌（使用 unoptimized） | ✅ |

---

## 当前项目推荐

**推荐方案一（纯静态部署）**，因为：

1. ✅ 所有页面都使用 `'use client'`，无 SSR 需求
2. ✅ 无 API Routes，API 都在 PHP 后端
3. ✅ 数据都是客户端获取，无服务端数据依赖
4. ✅ 部署更简单，性能更好

---

## 常见问题

### 1. 静态导出后路由 404？

确保 nginx 配置中有：
```nginx
location / {
    try_files $uri $uri.html $uri/index.html /index.html;
}
```

### 2. API 请求跨域？

在 nginx 中添加 CORS 头：
```nginx
location /v1/ {
    proxy_pass http://backend-url/v1/;
    add_header 'Access-Control-Allow-Origin' '*';
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
}
```

### 3. 如何更新部署？

```bash
# 本地构建
npm run build

# 上传 out 目录
rsync -avz ./out/ user@server:/var/www/lulalanew/out/

# 无需重启 nginx（除非修改了配置）
```

### 4. 开发环境如何运行？

```bash
# 开发模式（支持 rewrites）
npm run dev

# 访问 http://localhost:3000
```

---

## 性能优化建议

1. **启用 CDN**：将 `/out/_next/static/` 目录上传到 CDN
2. **启用 Brotli 压缩**：nginx 添加 `brotli on;`
3. **配置缓存策略**：静态资源设置长期缓存
4. **使用 HTTP/2**：nginx 启用 HTTP/2
5. **配置 SSL**：使用 Let's Encrypt 免费证书

---

## 监控和日志

```bash
# 查看 nginx 访问日志
sudo tail -f /var/log/nginx/access.log

# 查看 nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 查看 PHP-FPM 日志
sudo tail -f /var/log/php-fpm/error.log
```

---

## 安全建议

1. ✅ 使用 HTTPS（Let's Encrypt）
2. ✅ 定期更新依赖 `npm audit fix`
3. ✅ 限制 PHP 后端访问权限
4. ✅ 配置防火墙规则
5. ✅ 定期备份数据库和代码

---

## 总结

您的项目**完全可以不依赖 Node.js 运行时**，直接部署到 nginx！

已为您：
- ✅ 修改了 `next.config.js`，启用静态导出
- ✅ 创建了 `nginx.conf.example` 配置示例
- ✅ 提供了完整的部署指南

现在可以直接运行 `npm run build` 生成静态文件，然后部署到 nginx 了！

