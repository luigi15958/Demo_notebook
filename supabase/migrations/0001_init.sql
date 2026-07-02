-- מחברת החונכות האישית — סכמה ראשונית ל-Supabase (MVP)
-- עקרון מנחה: פרטיות by design. חונכ.ת רואה רק את החניכים שלה;
-- הרשאות נאכפות ב-Row-Level Security, לא בלקוח.

-- פרופיל משתמש (מרחיב את auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  role text not null check (role in ('mentor', 'coordinator')) default 'mentor',
  created_at timestamptz not null default now()
);

-- חניכים.ות — משויכים לחונכ.ת לשנה הנוכחית
-- (ריבוי שנות לימוד יתווסף בשלב 4 עם טבלת school_years ו-mentorships)
create table public.students (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.profiles (id),
  name text not null,
  group_name text not null default '',
  birth_date date,
  intake_notes text not null default '',
  strengths text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- מפגשי חונכות — פורמט התיעוד מחוברת החונכות
create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  mentor_id uuid not null references public.profiles (id),
  date date not null,
  duration_min int not null default 20 check (duration_min between 5 and 180),
  focus text not null check (focus in ('being', 'doing', 'combined')) default 'combined',
  topics text not null default '',
  strengths_and_challenges text not null default '',
  actions text not null default '',
  insights text not null default '',
  sharing text not null default '',
  created_at timestamptz not null default now()
);

-- מטרות אישיות בארבעת התחומים
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  domain text not null check (domain in ('academic', 'social', 'personal', 'emotional')),
  title text not null,
  description text not null default '',
  status text not null check (status in ('active', 'done', 'paused')) default 'active',
  created_at timestamptz not null default now()
);

-- יומן קשר — משולש התקשורת (הורים, מורים, יועצת, רכזת)
create table public.contact_log (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  date date not null,
  party text not null check (party in ('parent', 'teacher', 'counselor', 'coordinator', 'other')),
  channel text not null check (channel in ('talk', 'phone', 'message', 'email', 'meeting')),
  summary text not null,
  follow_up text not null default ''
);

create index students_mentor_idx on public.students (mentor_id);
create index meetings_student_idx on public.meetings (student_id, date desc);
create index goals_student_idx on public.goals (student_id);
create index contact_log_student_idx on public.contact_log (student_id, date desc);

-- ===== Row-Level Security =====

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.meetings enable row level security;
alter table public.goals enable row level security;
alter table public.contact_log enable row level security;

-- כל משתמש מחובר רואה פרופילים (שמות ותפקידים בלבד — לא תוכן)
create policy "profiles are readable by staff"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users manage own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

-- חונכ.ת: גישה מלאה לחניכים שלה בלבד
create policy "mentor reads own students"
  on public.students for select
  to authenticated
  using (mentor_id = auth.uid());

create policy "mentor adds own students"
  on public.students for insert
  to authenticated
  with check (mentor_id = auth.uid());

create policy "mentor updates own students"
  on public.students for update
  to authenticated
  using (mentor_id = auth.uid());

-- מפגשים: רק החונכ.ת של החניכ.ה
create policy "mentor reads own meetings"
  on public.meetings for select
  to authenticated
  using (mentor_id = auth.uid());

create policy "mentor adds own meetings"
  on public.meetings for insert
  to authenticated
  with check (
    mentor_id = auth.uid()
    and exists (
      select 1 from public.students s
      where s.id = student_id and s.mentor_id = auth.uid()
    )
  );

-- מטרות ויומן קשר: דרך הבעלות על החניכ.ה
create policy "mentor reads own students goals"
  on public.goals for select
  to authenticated
  using (exists (
    select 1 from public.students s
    where s.id = student_id and s.mentor_id = auth.uid()
  ));

create policy "mentor writes own students goals"
  on public.goals for insert
  to authenticated
  with check (exists (
    select 1 from public.students s
    where s.id = student_id and s.mentor_id = auth.uid()
  ));

create policy "mentor updates own students goals"
  on public.goals for update
  to authenticated
  using (exists (
    select 1 from public.students s
    where s.id = student_id and s.mentor_id = auth.uid()
  ));

create policy "mentor reads own students contacts"
  on public.contact_log for select
  to authenticated
  using (exists (
    select 1 from public.students s
    where s.id = student_id and s.mentor_id = auth.uid()
  ));

create policy "mentor writes own students contacts"
  on public.contact_log for insert
  to authenticated
  with check (exists (
    select 1 from public.students s
    where s.id = student_id and s.mentor_id = auth.uid()
  ));

-- הערה לשלב 3: מדיניות לרכזת (מטא-דאטה בלבד: קיום מפגש ותאריך, ללא תוכן)
-- תמומש באמצעות view ייעודי + מנגנון "שבירת זכוכית" (יועצת+מנהל, סיבה מתועדת,
-- הודעה לחונכת ורישום ב-audit log). לא נכלל ב-MVP במכוון.
