-- ============================================================
-- מחברת החונכות — הקמה מלאה של בסיס הנתונים בהדבקה אחת
-- מריצים פעם אחת ב-SQL Editor של פרויקט Supabase חדש.
-- מקור: supabase/migrations/0001–0006 (מוצמד אוטומטית).
-- ============================================================

-- ------------------------------------------------------------
-- supabase/migrations/0001_init.sql
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- supabase/migrations/0002_personalization_schedule.sql
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- supabase/migrations/0003_template_cover_quote.sql
-- ------------------------------------------------------------
-- תבנית תיעוד אישית ו"כריכה" לחניכ.ה

-- משפט אישי שהילד.ה בחר.ה, מוצג בראש הכרטיס
alter table public.students
  add column cover_quote text not null default '';

-- ערכי השדות המותאמים אישית מתבנית התיעוד של החונכ.ת
-- נשמרים עם התווית כפי שהייתה בזמן המפגש, כדי שהתיעוד יישאר קריא
-- גם אם התבנית תשתנה בהמשך
alter table public.meetings
  add column custom_fields jsonb not null default '[]';

-- הערה: תבנית התיעוד וסדר מסך הבית נשמרים בתוך profiles.prefs (jsonb),
-- ללא צורך בשינוי סכמה נוסף.

-- ------------------------------------------------------------
-- supabase/migrations/0004_messages_dashboard.sql
-- ------------------------------------------------------------
-- הודעות רכזת ↔ חונכים (תפוצה ואישיות, עם אישורי קריאה)
-- ודשבורד רכזת מבוסס מטא-נתונים בלבד.

-- בדיקת תפקיד רכזת — משמשת את כל המדיניות בהמשך
create or replace function public.is_coordinator()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'coordinator'
  );
$$;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id),
  body text not null,
  created_at timestamptz not null default now()
);

create table public.message_recipients (
  message_id uuid not null references public.messages (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id),
  read_at timestamptz, -- אישור קריאה
  primary key (message_id, recipient_id)
);

create index message_recipients_recipient_idx
  on public.message_recipients (recipient_id, read_at);

alter table public.messages enable row level security;
alter table public.message_recipients enable row level security;

-- רכזות שולחות; שתי הרכזות רואות את כל ההודעות שנשלחו
create policy "coordinators send messages"
  on public.messages for insert
  to authenticated
  with check (public.is_coordinator() and sender_id = auth.uid());

create policy "coordinators and recipients read messages"
  on public.messages for select
  to authenticated
  using (
    public.is_coordinator()
    or exists (
      select 1 from public.message_recipients r
      where r.message_id = id and r.recipient_id = auth.uid()
    )
  );

create policy "coordinators add recipients"
  on public.message_recipients for insert
  to authenticated
  with check (public.is_coordinator());

create policy "coordinators and recipients read receipts"
  on public.message_recipients for select
  to authenticated
  using (public.is_coordinator() or recipient_id = auth.uid());

-- חונכ.ת מאשר.ת קריאה על השורה שלה בלבד
create policy "recipient confirms read"
  on public.message_recipients for update
  to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- דשבורד הרכזת: מטא-נתונים מצרפיים בלבד — ללא תוכן מפגשים.
-- security definer עוקף את ה-RLS של החונכים, ולכן הפונקציה מחזירה
-- אך ורק ספירות ותאריכים, ורק לרכזות.
create or replace function public.coordinator_overview()
returns table (
  mentor_id uuid,
  mentor_name text,
  student_count bigint,
  meetings_last_14 bigint,
  last_meeting_date date,
  stale_students bigint
)
language sql stable security definer
set search_path = public
as $$
  select
    p.id,
    p.name,
    (select count(*) from students s where s.mentor_id = p.id),
    (select count(*) from meetings m
       where m.mentor_id = p.id and m.date >= current_date - 14),
    (select max(m.date) from meetings m where m.mentor_id = p.id),
    (select count(*) from students s
       where s.mentor_id = p.id
         and not exists (
           select 1 from meetings m
           where m.student_id = s.id and m.date >= current_date - 10
         ))
  from profiles p
  where p.role = 'mentor'
    and public.is_coordinator();
$$;

grant execute on function public.coordinator_overview() to authenticated;
grant execute on function public.is_coordinator() to authenticated;

-- ------------------------------------------------------------
-- supabase/migrations/0005_goals_workspaces_notes.sql
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- supabase/migrations/0006_divisions_assignment.sql
-- ------------------------------------------------------------
-- שלב א' של מסמך האבטחה: חטיבות, שכבות, מאגר שיבוץ ובחירת חניכים

-- חטיבה לחונכ.ת; שכבה לחניכ.ה; ילד.ה ללא שיוך = במאגר
alter table public.profiles
  add column division text not null default '';

alter table public.students
  add column grade text not null default '',
  alter column mentor_id drop not null;

-- הגדרות שיבוץ
insert into public.app_settings (key, value) values
  ('assignment_locked', 'false'),
  ('mentor_cap', '15');

-- חונכים רואים את מאגר הלא-משויכים (שם/חטיבה/שכבה — אין עדיין תוכן רגיש)
create policy "mentors read unassigned pool"
  on public.students for select
  to authenticated
  using (mentor_id is null);

create or replace function public.get_assign_settings()
returns table (locked boolean, cap int)
language sql stable security definer
set search_path = public
as $$
  select
    (select value = 'true' from app_settings where key = 'assignment_locked'),
    (select value::int from app_settings where key = 'mentor_cap');
$$;

create or replace function public.set_assign_settings(p_locked boolean, p_cap int)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_coordinator() then
    raise exception 'פעולה לרכזת בלבד';
  end if;
  update app_settings set value = case when p_locked then 'true' else 'false' end
    where key = 'assignment_locked';
  update app_settings set value = p_cap::text where key = 'mentor_cap';
end;
$$;

-- בחירת חניכ.ה ע"י חונכ.ת: נעילה, כפילות ותקרה נאכפות כאן — בשרת
create or replace function public.claim_student(p_student_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_locked boolean;
  v_cap int;
  v_count int;
begin
  select value = 'true' into v_locked from app_settings where key = 'assignment_locked';
  if v_locked then
    raise exception 'השיבוץ נעול — פנו לרכזת החונכות';
  end if;
  select value::int into v_cap from app_settings where key = 'mentor_cap';
  select count(*) into v_count from students where mentor_id = auth.uid();
  if v_count >= v_cap then
    raise exception 'הגעת לתקרת החניכים (%) — פנו לרכזת', v_cap;
  end if;
  update students set mentor_id = auth.uid()
    where id = p_student_id and mentor_id is null;
  if not found then
    raise exception 'החניכ.ה כבר שויכ.ה לחונכ.ת אחר.ת';
  end if;
end;
$$;

-- לוח השיבוץ לרכזת: מטא-נתונים בלבד (ללא תיק היכרות ותוכן)
create or replace function public.coordinator_assignment_board()
returns table (id uuid, name text, division text, grade text, mentor_id uuid)
language sql stable security definer
set search_path = public
as $$
  select s.id, s.name, s.group_name, s.grade, s.mentor_id
  from students s
  where public.is_coordinator()
  order by s.group_name, s.grade, s.name;
$$;

create or replace function public.coordinator_assign(p_student_id uuid, p_mentor_id uuid)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_coordinator() then
    raise exception 'פעולה לרכזת בלבד';
  end if;
  update students set mentor_id = p_mentor_id where id = p_student_id;
end;
$$;

-- ייבוא תלמידים למאגר (רכזת): שם, חטיבה, שכבה, תאריך לידה
create or replace function public.import_students(p_rows jsonb)
returns int
language plpgsql security definer
set search_path = public
as $$
declare
  v_added int;
begin
  if not public.is_coordinator() then
    raise exception 'פעולה לרכזת בלבד';
  end if;
  insert into students (mentor_id, name, group_name, grade, birth_date)
  select null, r->>'name', r->>'division', r->>'grade', (r->>'birth_date')::date
  from jsonb_array_elements(p_rows) r
  where coalesce(trim(r->>'name'), '') <> '';
  get diagnostics v_added = row_count;
  return v_added;
end;
$$;

-- טופס הפתקים: רק ילדים שכבר משויכים לחונכ.ת
create or replace function public.list_students_for_notes(access_code text)
returns table (id uuid, name text)
language sql stable security definer
set search_path = public
as $$
  select s.id, s.name from public.students s
  where public.check_note_code(access_code) and s.mentor_id is not null
  order by s.name;
$$;

grant execute on function public.get_assign_settings() to authenticated;
grant execute on function public.set_assign_settings(boolean, int) to authenticated;
grant execute on function public.claim_student(uuid) to authenticated;
grant execute on function public.coordinator_assignment_board() to authenticated;
grant execute on function public.coordinator_assign(uuid, uuid) to authenticated;
grant execute on function public.import_students(jsonb) to authenticated;
