import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// GET: 获取单个笔记
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const sb = getSupabase();

    if (!sb) {
      return NextResponse.json({ error: "数据库未配置" }, { status: 503 });
    }

    const { data, error } = await sb
      .from("notes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("获取笔记失败:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PUT: 更新笔记
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const updates = await request.json();
    const sb = getSupabase();

    if (!sb) {
      return NextResponse.json({ ...updates, id, _storage: "local" });
    }

    const { data, error } = await sb
      .from("notes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("更新笔记失败:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: 删除笔记
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const sb = getSupabase();

    if (!sb) {
      return NextResponse.json({ success: true });
    }

    const { error } = await sb.from("notes").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除笔记失败:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
