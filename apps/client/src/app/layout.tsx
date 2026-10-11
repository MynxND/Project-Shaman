import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Noto_Sans_Thai } from 'next/font/google';
import './globals.css';
import '@/components/ui-kit/ui-kit.css';
// Thai headings use Torsilp ThaiMai; body and item text use Noto Sans Thai (src/app/fonts/README.md).
const torsilp = localFont({ src: './fonts/TorsilpThaiMai.ttf', variable: '--font-torsilp', display: 'swap' });
const notoThai = Noto_Sans_Thai({ subsets: ['thai', 'latin'], variable: '--font-noto-thai', display: 'swap' });
export const metadata: Metadata = { title: 'Project Shaman', description: 'Global Shaman foundation' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };
export default function Layout({children}: Readonly<{children: React.ReactNode}>) {
  // Browser extensions add attributes to <body> before hydration (e.g. data-cjcrx); ignore that one-level mismatch.
  return <html lang="th" className={`${torsilp.variable} ${notoThai.variable}`}><body suppressHydrationWarning>{children}</body></html>;
}
