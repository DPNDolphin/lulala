import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '全网交易所推荐链接 - 币安、欧易、芝麻开门等主流交易所注册',
  description: '提供币安、欧易、芝麻开门、Bybit等主流交易所的推荐链接和邀请码，享受专属返佣优惠。包含中心化和去中心化交易所，安全可靠，返佣比例透明。',
  keywords: '交易所推荐,币安推荐,欧易推荐,芝麻开门推荐,Bybit推荐,交易所邀请码,返佣链接,加密货币交易所,中心化交易所,去中心化交易所',
  openGraph: {
    title: '全网交易所推荐链接 - 享受专属返佣优惠',
    description: '提供主流交易所推荐链接和邀请码，包含币安、欧易、芝麻开门等，享受专属返佣优惠，安全可靠。',
    type: 'website',
    url: '/r',
    images: [
      {
        url: '/lulala_logo.png',
        width: 1200,
        height: 630,
        alt: 'Lulala交易所推荐链接',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '全网交易所推荐链接 - 享受专属返佣优惠',
    description: '提供主流交易所推荐链接和邀请码，包含币安、欧易、芝麻开门等，享受专属返佣优惠。',
    images: ['/lulala_logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/r',
  },
}

export default function ReferralLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
