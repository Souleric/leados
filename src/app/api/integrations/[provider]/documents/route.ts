import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const { searchParams } = new URL(request.url);
    const docType = searchParams.get("type") ?? "quotation"; // quotation | invoice
    const search = searchParams.get("q") ?? "";

    const workspaceId = process.env.WORKSPACE_ID;
    if (!workspaceId) return NextResponse.json({ error: "WORKSPACE_ID not set" }, { status: 500 });

    // Fetch stored credentials
    const supabase = createAdminClient();
    const { data: integration, error } = await supabase
      .from("integrations")
      .select("config, is_active")
      .eq("workspace_id", workspaceId)
      .eq("provider", provider)
      .single();

    if (error || !integration) return NextResponse.json({ error: "Integration not configured" }, { status: 404 });
    if (!integration.is_active) return NextResponse.json({ error: "Integration is not connected" }, { status: 400 });

    const config = integration.config as Record<string, string>;
    let documents: Document[] = [];

    if (provider === "bukku") {
      documents = await fetchBukkuDocs(config, docType, search);
    } else if (provider === "autocount_cloud") {
      documents = await fetchAutocountCloudDocs(config, docType, search);
    } else if (provider === "autocount_aotg") {
      documents = await fetchAutocountAotgDocs(config, docType, search);
    } else {
      return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
    }

    return NextResponse.json({ documents });
  } catch (err: any) {
    console.error("[GET /api/integrations/[provider]/documents]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to fetch documents" }, { status: 500 });
  }
}

interface Document {
  id: string;
  doc_number: string;
  doc_date: string;
  due_date?: string;
  customer_name: string;
  amount: number;
  currency: string;
  status: string;
  doc_type: string;
  raw: Record<string, any>;
}

async function fetchBukkuDocs(config: Record<string, string>, docType: string, search: string): Promise<Document[]> {
  const { api_token } = config;
  const endpoint = docType === "invoice" ? "invoices" : "quotes";

  const qs = new URLSearchParams({ per_page: "50" });
  if (search) qs.set("search", search);

  const res = await fetch(`https://api.bukku.my/sales/${endpoint}?${qs}`, {
    headers: {
      Authorization: `Bearer ${api_token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) throw new Error(`Bukku API error: ${res.status}`);
  const json = await res.json();
  const rows = json.data ?? json ?? [];

  return rows.map((r: any) => ({
    id: String(r.id),
    doc_number: r.number ?? r.doc_number ?? r.reference ?? "",
    doc_date: r.date ?? r.created_at ?? "",
    due_date: r.due_date ?? undefined,
    customer_name: r.contact?.name ?? r.customer_name ?? "",
    amount: parseFloat(r.total ?? r.amount ?? "0"),
    currency: r.currency ?? "MYR",
    status: r.status ?? "",
    doc_type: docType,
    raw: r,
  }));
}

async function fetchAutocountCloudDocs(config: Record<string, string>, docType: string, search: string): Promise<Document[]> {
  const { api_key, key_id } = config;
  const endpoint = docType === "invoice" ? "Invoice" : "Quotation";

  const qs = new URLSearchParams({ pageSize: "50" });
  if (search) qs.set("docNo", search);

  const res = await fetch(`https://accounting-api.autocountcloud.com/api/${endpoint}?${qs}`, {
    headers: {
      "API-Key": api_key,
      "Key-ID": key_id,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error(`AutoCount Cloud API error: ${res.status}`);
  const json = await res.json();
  const rows = json.data ?? json.result ?? json ?? [];

  return rows.map((r: any) => ({
    id: String(r.id ?? r.DocKey ?? r.docKey ?? ""),
    doc_number: r.docNo ?? r.DocNo ?? r.invoiceNo ?? "",
    doc_date: r.docDate ?? r.DocDate ?? "",
    due_date: r.dueDate ?? r.DueDate ?? undefined,
    customer_name: r.companyName ?? r.CompanyName ?? r.debtorName ?? r.customerName ?? "",
    amount: parseFloat(r.totalAmount ?? r.TotalAmount ?? r.grandTotal ?? "0"),
    currency: r.currencyCode ?? "MYR",
    status: r.status ?? r.Status ?? "",
    doc_type: docType,
    raw: r,
  }));
}

async function fetchAutocountAotgDocs(config: Record<string, string>, docType: string, search: string): Promise<Document[]> {
  const { access_token } = config;
  const endpoint = docType === "invoice"
    ? "ARInvoice/GetARInvoiceList"
    : "ARQuotation/GetARQuotationList";

  const res = await fetch(`https://aotgapi.autocountcloud.com/api/public/v1/${endpoint}`, {
    headers: {
      SOTC_AUTH: access_token,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error(`AutoCount AOTG API error: ${res.status}`);
  const json = await res.json();
  const rows = json.data ?? json ?? [];

  const filtered = search
    ? rows.filter((r: any) => (r.DocNo ?? "").toLowerCase().includes(search.toLowerCase()) || (r.CompanyName ?? "").toLowerCase().includes(search.toLowerCase()))
    : rows;

  return filtered.slice(0, 50).map((r: any) => ({
    id: String(r.DocKey ?? r.id ?? ""),
    doc_number: r.DocNo ?? "",
    doc_date: r.DocDate ?? "",
    due_date: r.DueDate ?? undefined,
    customer_name: r.CompanyName ?? r.DebtorName ?? "",
    amount: parseFloat(r.TotalAmount ?? r.GrandTotal ?? "0"),
    currency: r.CurrencyCode ?? "MYR",
    status: r.Status ?? "",
    doc_type: docType,
    raw: r,
  }));
}
