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
