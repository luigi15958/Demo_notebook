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
