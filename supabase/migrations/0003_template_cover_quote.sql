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
