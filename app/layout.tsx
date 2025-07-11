import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Tour Đà Nẵng - Hội An | Hành trình khám phá miền Trung",
  description: "Trải nghiệm tour Đà Nẵng - Hội An 4 ngày 3 đêm với những địa điểm tuyệt vời",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
