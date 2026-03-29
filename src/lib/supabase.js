/**
 * Supabase 客户端与数据操作封装
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase = null;

export function getSupabase() {
  if (!supabase && supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

/**
 * 检查 Supabase 是否已配置
 */
export function isSupabaseConfigured() {
  return !!(supabaseUrl && supabaseKey);
}

// ========== Notes CRUD ==========

/**
 * 创建新笔记
 */
export async function createNote(noteData) {
  const sb = getSupabase();
  if (!sb) return saveNoteLocal(noteData);

  const { data, error } = await sb
    .from("notes")
    .insert([noteData])
    .select()
    .single();

  if (error) {
    console.error("创建笔记失败:", error);
    return saveNoteLocal(noteData);
  }
  return data;
}

/**
 * 获取所有笔记
 */
export async function getNotes() {
  const sb = getSupabase();
  if (!sb) return getNotesLocal();

  const { data, error } = await sb
    .from("notes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("获取笔记失败:", error);
    return getNotesLocal();
  }
  return data;
}

/**
 * 获取单个笔记
 */
export async function getNote(id) {
  const sb = getSupabase();
  if (!sb) return getNoteLocal(id);

  const { data, error } = await sb
    .from("notes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("获取笔记失败:", error);
    return getNoteLocal(id);
  }
  return data;
}

/**
 * 更新笔记
 */
export async function updateNote(id, updates) {
  const sb = getSupabase();
  if (!sb) return updateNoteLocal(id, updates);

  const { data, error } = await sb
    .from("notes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("更新笔记失败:", error);
    return updateNoteLocal(id, updates);
  }
  return data;
}

/**
 * 删除笔记
 */
export async function deleteNote(id) {
  const sb = getSupabase();
  if (!sb) return deleteNoteLocal(id);

  const { error } = await sb.from("notes").delete().eq("id", id);
  if (error) {
    console.error("删除笔记失败:", error);
    return deleteNoteLocal(id);
  }
  return true;
}

/**
 * 上传文件到 Storage
 */
export async function uploadFile(bucket, path, file) {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb.storage.from(bucket).upload(path, file, {
    upsert: true,
  });

  if (error) {
    console.error("上传文件失败:", error);
    return null;
  }

  const { data: urlData } = sb.storage.from(bucket).getPublicUrl(path);
  return urlData.publicUrl;
}

// ========== Local Storage Fallback ==========

function getLocalNotes() {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("biji-notes");
  return stored ? JSON.parse(stored) : [];
}

function setLocalNotes(notes) {
  if (typeof window === "undefined") return;
  localStorage.setItem("biji-notes", JSON.stringify(notes));
}

function saveNoteLocal(noteData) {
  const notes = getLocalNotes();
  // 图片数据不存 localStorage，由调用方存入 IndexedDB
  const { page_images, ...noteDataWithoutImages } = noteData;
  const note = {
    ...noteDataWithoutImages,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  notes.unshift(note);
  setLocalNotes(notes);
  return note;
}

function getNotesLocal() {
  return getLocalNotes();
}

function getNoteLocal(id) {
  const notes = getLocalNotes();
  return notes.find((n) => n.id === id) || null;
}

function updateNoteLocal(id, updates) {
  const notes = getLocalNotes();
  const idx = notes.findIndex((n) => n.id === id);
  if (idx === -1) return null;
  notes[idx] = { ...notes[idx], ...updates, updated_at: new Date().toISOString() };
  setLocalNotes(notes);
  return notes[idx];
}

function deleteNoteLocal(id) {
  const notes = getLocalNotes();
  setLocalNotes(notes.filter((n) => n.id !== id));
  return true;
}
