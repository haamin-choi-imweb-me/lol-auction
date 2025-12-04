import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LoL 경매 시스템',
  description: '롤 대회 경매 시스템 - 팀 구성 관리',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="antialiased grid-pattern">
        {children}
      </body>
    </html>
  );
}

