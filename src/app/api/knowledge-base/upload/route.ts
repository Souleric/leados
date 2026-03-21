import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["text/plain", "text/markdown", "application/pdf"];
const ALLOWED_EXTENSIONS = [".txt", ".md", ".pdf"];

async function extractText(file: File): Promise<string> {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();

  if (ext === ".txt" || ext === ".md") {
    return await file.text();
  }

  if (ext === ".pdf") {
    // For PDFs, read as ArrayBuffer and extract readable text portions.
    // This is a basic extraction — strips binary data, keeps text runs.
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const raw = new TextDecoder("latin1").decode(bytes);

    // Extract text between BT (begin text) and ET (end text) PDF operators
    const textRuns: string[] = [];
    const btEtRegex = /BT([\s\S]*?)ET/g;
    let match;
    while ((match = btEtRegex.exec(raw)) !== null) {
      const block = match[1];
      // Extract string literals: (text) and hex strings <hex>
      const strRegex = /\(([^)\\]*(?:\\.[^)\\]*)*)\)|<([0-9a-fA-F]+)>/g;
      let s;
      while ((s = strRegex.exec(block)) !== null) {
        if (s[1] !== undefined) {
          // Literal string — unescape PDF escape sequences
          const unescaped = s[1]
            .replace(/\\n/g, "\n")
            .replace(/\\r/g, "\r")
            .replace(/\\t/g, "\t")
            .replace(/\\\\/g, "\\")
            .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
            .replace(/\\./g, "");
          if (unescaped.trim()) textRuns.push(unescaped);
        } else if (s[2] !== undefined) {
          // Hex string
          const hex = s[2];
          let str = "";
          for (let i = 0; i < hex.length - 1; i += 2) {
            const code = parseInt(hex.slice(i, i + 2), 16);
            if (code > 31 && code < 127) str += String.fromCharCode(code);
          }
          if (str.trim()) textRuns.push(str);
        }
      }
    }

    const extracted = textRuns.join(" ").replace(/\s+/g, " ").trim();
    if (!extracted) throw new Error("Could not extract readable text from PDF. Try a text-based PDF (not scanned image).");
    return extracted;
  }

  throw new Error("Unsupported file type");
}

export async function POST(request: NextRequest) {
  try {
    const workspaceId = process.env.WORKSPACE_ID;
    if (!workspaceId) return NextResponse.json({ error: "WORKSPACE_ID not set" }, { status: 500 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string | null)?.trim();

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 400 });
    }

    const content = await extractText(file);
    if (!content.trim()) {
      return NextResponse.json({ error: "File appears to be empty or unreadable." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("knowledge_base")
      .insert({
        workspace_id: workspaceId,
        title,
        content,
        source_type: "file",
        file_name: file.name,
        file_url: null,
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ entry: data }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/knowledge-base/upload]", err);
    return NextResponse.json({ error: err?.message ?? "Upload failed" }, { status: 500 });
  }
}
