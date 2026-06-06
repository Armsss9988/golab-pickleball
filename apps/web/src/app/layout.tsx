import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Giải Pickleball GOLAB',
  description: 'Hệ thống quản lý giải đấu Pickleball GOLAB trực tuyến',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
