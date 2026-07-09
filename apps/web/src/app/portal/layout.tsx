import type { Metadata, Viewport } from 'next';
import { PortalShell } from './portal-shell';

export const metadata: Metadata = {
  title: 'Portal do sócio',
  description: 'Quota, cartão digital e recibos.',
  manifest: '/portal.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Portal',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
