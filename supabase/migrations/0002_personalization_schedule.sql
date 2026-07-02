-- שלב הפרסונליזציה: העדפות חונכ.ת, צבע ואימוג'י לחניכ.ה, מערכת שעות

-- העדפות אישיות ("כריכת המחברת") — נשמרות על הפרופיל
alter table public.profiles
  add column prefs jsonb not null default '{}';

-- זהות ויזואלית אישית לכל חניכ.ה
alter table public.students
  add column color text not null default '',
  add column emoji text not null default '';

-- מערכת שעות: רשומות ידניות + קובץ מצורף (תמונה כ-data URL או גיליון מפוענח)
create table public.schedules (
  student_id uuid primary key references public.students (id) on delete cascade,
  entries jsonb not null default '[]',
  attachment jsonb,
  updated_at timestamptz not null default now()
);

alter table public.schedules enable row level security;

create policy "mentor reads own students schedules"
  on public.schedules for select
  to authenticated
  using (exists (
    select 1 from public.students s
    where s.id = student_id and s.mentor_id = auth.uid()
  ));

create policy "mentor inserts own students schedules"
  on public.schedules for insert
  to authenticated
  with check (exists (
    select 1 from public.students s
    where s.id = student_id and s.mentor_id = auth.uid()
  ));

create policy "mentor updates own students schedules"
  on public.schedules for update
  to authenticated
  using (exists (
    select 1 from public.students s
    where s.id = student_id and s.mentor_id = auth.uid()
  ));
