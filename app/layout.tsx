import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "KnowledgeHub - Sentinent",
  description: "A modern platform for collecting and managing knowledge through user submissions",
  generator: 'v0.dev',
  icons: {
    icon: "/favicon.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        {/* Admin Test Bubble */}
        <AdminTestBubble />
      </body>
    </html>
  )
}

function AdminTestBubble() {
  const email = process.env.NEXT_PUBLIC_ADMIN_TEST_EMAIL;
  const otp = process.env.NEXT_PUBLIC_ADMIN_TEST_OTP;
  if (!email || !otp) return null;
  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 1000 }}>
      <div style={{ background: '#0ea5e9', color: 'white', padding: '12px 16px', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', fontSize: 13 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Admin Test</div>
        <div><strong>Email:</strong> {email}</div>
        <div><strong>OTP:</strong> {otp}</div>
      </div>
    </div>
  );
}
