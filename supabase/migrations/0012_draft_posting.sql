-- 0012: draft_posting — sinkronisasi draft wizard ke Supabase (Fase 2-C).
-- Satu baris per user: seluruh state draft wizard disimpan sebagai JSONB.
-- Idempoten: create table/index dibungkus "if not exists", policy di-drop dulu.

create table if not exists draft_posting (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table draft_posting enable row level security;

drop policy if exists "draft_posting_select_own" on draft_posting;
drop policy if exists "draft_posting_insert_own" on draft_posting;
drop policy if exists "draft_posting_update_own" on draft_posting;
drop policy if exists "draft_posting_delete_own" on draft_posting;

create policy "draft_posting_select_own"
  on draft_posting for select using (auth.uid() = user_id);
create policy "draft_posting_insert_own"
  on draft_posting for insert with check (auth.uid() = user_id);
create policy "draft_posting_update_own"
  on draft_posting for update using (auth.uid() = user_id);
create policy "draft_posting_delete_own"
  on draft_posting for delete using (auth.uid() = user_id);
