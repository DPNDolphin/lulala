/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // 启用静态导出（可以部署到 nginx）
  output: 'export',
  
  // 静态导出时禁用图片优化（或使用 unoptimized）
  images: {
    unoptimized: true,
    domains: [
      'lh3.googleusercontent.com',  // Google 用户头像
      'rs.debot.ai',                // 代币图标API
    ],
  },
  
  // 注意：静态导出不支持 rewrites，需要在 nginx 中配置
  // 以下配置仅在开发模式（npm run dev）时生效
  ...(!process.env.NODE_ENV || process.env.NODE_ENV === 'development' ? {
    async rewrites() {
      return [
        {
          source: '/v1/:path*',
          destination: 'http://lulala.ju4.com/v1/:path*',
        },
      ]
    },
  } : {}),
  
  webpack: (config, { isServer }) => {
    // 修复 chunk 加载路径问题
    if (!isServer) {
      config.output.publicPath = '/_next/'
    }
    
    // 排除某些包的服务端渲染
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    
    return config
  },
}

module.exports = nextConfig
