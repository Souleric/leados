/**
 * POST /api/meta/embedded-signup
 *
 * After the client completes Meta Embedded Signup in the browser,
 * the frontend sends us the short-lived `code`.
 * We exchange it for a long-lived System User token and save it.
 *
 * Meta docs: https://developers.facebook.com/docs/whatsapp/embedded-signup/auth-code
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, wabaId, phoneNumberId } = body as {
      code: string;
      wabaId?: string;
      phoneNumberId?: string;
    };

    if (!code) {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    if (!appId || !appSecret) {
      return NextResponse.json(
        { error: "META_APP_ID / META_APP_SECRET not configured on server" },
        { status: 500 }
      );
    }

    // 1. Exchange code for short-lived user access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token` +
        `?client_id=${appId}&client_secret=${appSecret}&code=${code}`,
      { cache: "no-store" }
    );

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) {
      return NextResponse.json(
        { error: tokenData.error?.message ?? "Token exchange failed" },
        { status: 400 }
      );
    }

    const shortLivedToken: string = tokenData.access_token;

    // 2. Exchange for long-lived token
    const longRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token` +
        `?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`,
      { cache: "no-store" }
    );

    const longData = await longRes.json();
    if (!longRes.ok || longData.error) {
      return NextResponse.json(
        { error: longData.error?.message ?? "Long-lived token exchange failed" },
        { status: 400 }
      );
    }

    const accessToken: string = longData.access_token;

    // 3. If phoneNumberId not provided, fetch from WABA
    let resolvedPhoneId = phoneNumberId;
    let phoneDisplay: string | null = null;
    let verifiedName: string | null = null;

    if (!resolvedPhoneId && wabaId) {
      const phonesRes = await fetch(
        `https://graph.facebook.com/v19.0/${wabaId}/phone_numbers?access_token=${accessToken}`,
        { cache: "no-store" }
      );
      const phonesData = await phonesRes.json();
      const first = phonesData.data?.[0];
      if (first) {
        resolvedPhoneId = first.id;
        phoneDisplay = first.display_phone_number;
        verifiedName = first.verified_name;
      }
    }

    // 4. If we have phoneNumberId, get display details
    if (resolvedPhoneId && !phoneDisplay) {
      const detailRes = await fetch(
        `https://graph.facebook.com/v19.0/${resolvedPhoneId}?fields=display_phone_number,verified_name&access_token=${accessToken}`,
        { cache: "no-store" }
      );
      const detailData = await detailRes.json();
      phoneDisplay = detailData.display_phone_number ?? null;
      verifiedName = detailData.verified_name ?? null;
    }

    // 5. Save to workspace
    const workspaceId = process.env.WORKSPACE_ID;
    if (workspaceId) {
      const supabase = createAdminClient();
      await supabase
        .from("workspaces")
        .update({
          meta_access_token: accessToken,
          meta_waba_id: wabaId ?? null,
          meta_phone_number_id: resolvedPhoneId ?? null,
          meta_phone_display: phoneDisplay,
          meta_business_name: verifiedName,
          meta_connected: true,
          meta_connected_at: new Date().toISOString(),
        })
        .eq("id", workspaceId);
    }

    return NextResponse.json({
      success: true,
      phoneNumberId: resolvedPhoneId,
      phoneDisplay,
      verifiedName,
    });
  } catch (err) {
    console.error("[POST /api/meta/embedded-signup]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
