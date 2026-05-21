import { NextResponse } from 'next/server';

/**
 * Download endpoint — redirects to the latest installer.
 * Replace DOWNLOAD_URL with your actual installer URL (GitHub releases, S3, etc.)
 */
export async function GET() {
  const DOWNLOAD_URL = process.env.APP_DOWNLOAD_URL || '#';

  if (DOWNLOAD_URL === '#') {
    return NextResponse.json(
      { error: 'Download not available yet. Please check back soon.' },
      { status: 503 }
    );
  }

  return NextResponse.redirect(DOWNLOAD_URL);
}
