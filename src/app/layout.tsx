import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { I18nProvider } from '@/lib/i18n/provider'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'),
  title: 'FengShuiMing - Asian Baby Name Generator',
  description:
    'Generate meaningful Asian baby names with Feng Shui analysis (五格剖象, 八字五行) for Chinese, Japanese, Korean, and Vietnamese cultures',
  openGraph: {
    title: 'FengShuiMing - Asian Baby Name Generator',
    description: 'Generate meaningful Asian baby names with Feng Shui analysis',
    type: 'website',
    locale: 'vi_VN',
    alternateLocale: ['zh_CN'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FengShuiMing - Asian Baby Name Generator',
    description: 'Generate meaningful Asian baby names with Feng Shui analysis',
  },
  alternates: {
    languages: {
      'vi-VN': '/vi',
      'zh-CN': '/zh',
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'FengShuiMing',
    description:
      'Generate meaningful Asian baby names with Feng Shui analysis (五格剖象, 八字五行) for Chinese, Japanese, Korean, and Vietnamese cultures',
    applicationCategory: 'Lifestyle',
    operatingSystem: 'Any',
  }

  return (
    <html>
      {/* TODO: make dynamic when adding per-locale routing (e.g. /vi/, /zh/) */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-br from-purple-50 via-white to-amber-50`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ErrorBoundary>
          <I18nProvider>{children}</I18nProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
