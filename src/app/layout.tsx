import type { Metadata } from 'next'
import './globals.css'
import ClientLayout from '@/components/ClientLayout'

export const metadata: Metadata = {
  title: 'Lulala',
  description: '提供最新的区块链研究、市场分析、项目评估和行业资讯，助力您在数字资产领域做出明智决策。',
  keywords: '区块链研究,数字资产,加密货币,DeFi,NFT,Web3',
  icons: {
    icon: '/lulala_logo.png',
    shortcut: '/lulala_logo.png',
    apple: '/lulala_logo.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: 'rgb(237, 90, 143)',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        {/* 首屏前注入主题，避免闪烁 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  var theme = saved === 'light' ? 'light' : 'dark';
                  var root = document.documentElement;
                  root.classList.add(theme === 'light' ? 'light-theme' : 'dark-theme');
                } catch (e) {
                  document.documentElement.classList.add('dark-theme');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
