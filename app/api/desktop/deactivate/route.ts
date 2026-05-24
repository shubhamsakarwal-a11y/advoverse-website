import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Desktop app API to deactivate license from current machine
 * Called when user wants to manually deactivate before moving to new machine
 */
export async function POST(req: NextRequest) {
  try {
    const { licenseKey, machineId } = await req.json();

    if (!licenseKey || !machineId) {
      return NextResponse.json({ 
        error: 'License key and machine ID required' 
      }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get license details
    const { data: license } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key', licenseKey)
      .single();

    if (!license) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid license key',
        code: 'INVALID_LICENSE'
      }, { status: 404 });
    }

    // Get activation for this machine
    const { data: activation } = await supabase
      .from('license_activations')
      .select('*')
      .eq('license_id', license.id)
      .eq('machine_id', machineId)
      .eq('is_active', true)
      .single();

    if (!activation) {
      return NextResponse.json({ 
        success: false,
        error: 'License not activated on this machine',
        code: 'NOT_ACTIVATED'
      }, { status: 404 });
    }

    // Deactivate the license
    const { error: deactivateError } = await supabase
      .from('license_activations')
      .update({ 
        is_active: false,
        deactivated_at: new Date().toISOString()
      })
      .eq('id', activation.id);

    if (deactivateError) {
      console.error('Deactivation error:', deactivateError);
      return NextResponse.json({ 
        error: 'Failed to deactivate license' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'License deactivated successfully',
      deactivation: {
        machineName: activation.machine_name,
        deactivatedAt: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('Deactivation error:', err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Deactivation failed' 
    }, { status: 500 });
  }
}
