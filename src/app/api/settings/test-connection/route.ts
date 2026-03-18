/**
 * POST /api/settings/test-connection
 * Validates Meta credentials by calling the Graph API.
 * Returns the phone number display name + WABA info if valid.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, phoneNumberId } = body as {
      accessToken: string;
      phoneNumberId: string;
    };

    if (!accessToken || !phoneNumberId) {
      return NextResponse.json(
        { error: "accessToken and phoneNumberId are required" },
        { status: 400 }
      );
    }

    // Call Meta Graph API to verify credentials
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating&access_token=${accessToken}`,
      { cache: "no-store" }
    );

    const data = await res.json();

    if (!res.ok || data.error) {
      return NextResponse.json(
        {
          success: false,
          error: data.error?.message ?? "Invalid credentials",
          code: data.error?.code,
        },
        { status: 400 }
      );
    }

    // Save the verified display number back to workspace
    try {
      const supabase = createAdminClient();
      const workspaceId = process.env.WORKSPACE_ID;
      if (workspaceId) {
        await supabase
          .from("workspaces")
          .update({
            meta_connected: true,
            meta_connected_at: new Date().toISOString(),
            meta_phone_display: data.display_phone_number,
            meta_business_name: data.verified_name,
          })
          .eq("id", workspaceId);
      }
    } catch {
      // Non-fatal — still return success
    }

    return NextResponse.json({
      success: true,
      phoneDisplay: data.display_phone_number,
      verifiedName: data.verified_name,
      qualityRating: data.quality_rating,
    });
  } catch (err) {
    console.error("[POST /api/settings/test-connection]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
