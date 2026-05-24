import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Advoverse ⚖ – Professional Litigation Infrastructure',
  description:
    'Advoverse (Caseline) is an all‑in‑one litigation management infrastructure for advocates and law chambers. Built for organised litigation practice, strategic workflow and disciplined chamber operations.',
  keywords: 'litigation management, chamber management, advocate software, legal case management, law firm software, India, caseline',
  openGraph: {
    title: 'Advoverse ⚖ – Professional Litigation Infrastructure',
    description:
      'Organise. Strategize. Succeed. Professional litigation management infrastructure for advocates and chambers.',
    url: 'https://advoverse.com',
    siteName: 'Advoverse',
    type: 'website',
  },
  metadataBase: new URL('https://advoverse.com'),
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: 'advoverse-verification',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
