import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// GET: 获取所有笔记
export async function GET() {
  try {
    const sb = getSupabase();
    if (!sb) {
      return NextResponse.json([]);
    }

    const { data, error } = await sb
      .from("notes")
      .select("id, title, subject, tags, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("获取笔记失败:", error);
    return NextResponse.json([], { status: 500 });
  }
}

// POST: 创建新笔记
export async function POST(request) {
  try {
    const noteData = await request.json();
    const sb = getSupabase();

    if (!sb) {
      // Fallback: 返回带 ID 的数据给前端存 localStorage
      return NextResponse.json({
        ...noteData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _storage: "local",
      });
    }

    const { data, error } = await sb
      .from("notes")
      .insert([{
        title: noteData.title,
        content: noteData.content,
        raw_text: noteData.raw_text,
        subject: noteData.subject || null,
        tags: noteData.tags || [],
        pdf_url: noteData.pdf_url || null,
        page_images: noteData.page_images || [],
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("创建笔记失败:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
