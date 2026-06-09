import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Public endpoint — Desktop app calls this to check for updates.
 * No auth required. Returns latest version info.
 * 
 * Query params:
 *  - currentVersion: (optional) current app version, e.g. "1.2.0"
 *  - platform: (optional) "windows" | "mac" | "linux", defaults to "windows"
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const currentVersion = searchParams.get('currentVersion') || '0.0.0';
    const platform = searchParams.get('platform') || 'windows';

    const supabase = createAdminClient();

    // Get the latest active update for this platform
    const { data: latest } = await supabase
      .from('app_updates')
      .select('*')
      .eq('is_active', true)
      .eq('platform', platform)
      .order('published_at', { ascending: false })
      .limit(1)
      .single();

    if (!latest) {
      return NextResponse.json({
        updateAvailable: false,
        message: 'You are on the latest version.'
      });
    }

    // Compare versions
    const isNewer = compareVersions(latest.version, currentVersion) > 0;

    if (!isNewer) {
      return NextResponse.json({
        updateAvailable: false,
        currentVersion,
        latestVersion: latest.version,
        message: 'You are on the latest version.'
      });
    }

    // Determine if it's a forced update
    const isMandatory = latest.is_mandatory || (latest.min_version && compareVersions(latest.min_version, currentVersion) > 0);

    return NextResponse.json({
      updateAvailable: true,
      mandatory: isMandatory,
      currentVersion,
      latestVersion: latest.version,
      title: latest.title,
      changelog: latest.changelog,
      downloadUrl: latest.download_url,
      fileSize: latest.file_size,
      publishedAt: latest.published_at,
      message: isMandatory
        ? `A critical update (v${latest.version}) is available. Please update now.`
        : `A new version (v${latest.version}) is available.`
    });

  } catch (err) {
    console.error('Check update error:', err);
    return NextResponse.json({
      updateAvailable: false,
      error: 'Failed to check for updates'
    }, { status: 500 });
  }
}

/**
 * Compare two semver strings. Returns:
 *  1 if a > b
 * -1 if a < b
 *  0 if a === b
 */
function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}
