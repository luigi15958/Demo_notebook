-- מטרות מועשרות (דרכי פעולה), מרחבי הכנה, ופתקים ורודים/כתומים

-- 1) דרכי פעולה למטרה — צ'קליסט צעדים
alter table public.goals
  add column steps jsonb not null default '[]';

-- 2) מרחבי הכנה — תוצר לכל ילד.ה × אירוע
create table public.workspace_drafts (
  student_id uuid not null references public.students (id) on delete cascade,
  event_id text not null,
  content text not null default '',
  updated_at timestamptz not null default now(),
  primary key (student_id, event_id)
);

alter table public.workspace_drafts enable row level security;

create policy "mentor reads own students drafts"
  on public.workspace_drafts for select
  to authenticated
  using (exists (
    select 1 from public.students s
    where s.id = student_id and s.mentor_id = auth.uid()
  ));

create policy "mentor writes own students drafts"
  on public.workspace_drafts for insert
  to authenticated
  with check (exists (
    select 1 from public.students s
    where s.id = student_id and s.mentor_id = auth.uid()
  ));

create policy "mentor updates own students drafts"
  on public.workspace_drafts for update
  to authenticated
  using (exists (
    select 1 from public.students s
    where s.id = student_id and s.mentor_id = auth.uid()
  ));

-- 3) פתקים ורודים/כתומים
-- שליחה: כל מורה, דרך קישור צוות + קוד בית-ספרי (ללא חשבון).
-- קריאה: החונכ.ת של הילד.ה בלבד.

create table public.app_settings (
  key text primary key,
  value text not null
);

alter table public.app_settings enable row level security;
-- אין מדיניות select — הקוד נבדק רק בתוך פונקציות security definer,
-- כך שהוא לעולם לא נחשף ללקוח.

-- קוד הצוות: לעדכן אחרי ההרצה! (למשל דרך SQL Editor)
insert into public.app_settings (key, value) values ('note_access_code', 'CHANGE-ME');

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  mentor_id uuid not null references public.profiles (id),
  teacher_name text not null,
  color text not null check (color in ('pink', 'orange')),
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index notes_mentor_idx on public.notes (mentor_id, read_at);
create index notes_student_idx on public.notes (student_id, created_at desc);

alter table public.notes enable row level security;

create policy "mentor reads own notes"
  on public.notes for select
  to authenticated
  using (mentor_id = auth.uid());

create policy "mentor marks own notes read"
  on public.notes for update
  to authenticated
  using (mentor_id = auth.uid())
  with check (mentor_id = auth.uid());

-- בדיקת קוד הצוות — פנימי בלבד
create or replace function public.check_note_code(access_code text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_settings
    where key = 'note_access_code' and value = access_code
  );
$$;

-- רשימת חניכים לטופס הפתקים — שמות ומזהים בלבד, רק עם קוד תקין
create or replace function public.list_students_for_notes(access_code text)
returns table (id uuid, name text)
language sql stable security definer
set search_path = public
as $$
  select s.id, s.name from public.students s
  where public.check_note_code(access_code)
  order by s.name;
$$;

-- שליחת פתק — מנותב אוטומטית לחונכ.ת של הילד.ה, רק עם קוד תקין
create or replace function public.submit_note(
  access_code text,
  p_student_id uuid,
  p_teacher_name text,
  p_color text,
  p_body text
)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.check_note_code(access_code) then
    raise exception 'קוד שגוי';
  end if;
  if p_color not in ('pink', 'orange') then
    raise exception 'צבע פתק לא חוקי';
  end if;
  insert into public.notes (student_id, mentor_id, teacher_name, color, body)
  select p_student_id, s.mentor_id, p_teacher_name, p_color, p_body
  from public.students s where s.id = p_student_id;
end;
$$;

-- הפונקציות זמינות גם ללא התחברות (טופס המורים הציבורי)
grant execute on function public.check_note_code(text) to anon, authenticated;
grant execute on function public.list_students_for_notes(text) to anon, authenticated;
grant execute on function public.submit_note(text, uuid, text, text, text) to anon, authenticated;
