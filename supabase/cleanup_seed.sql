-- Remove as apostas de exemplo (mockdata) que foram inseridas pelo seed.sql antigo.
-- Corre isto uma vez no SQL Editor do Supabase.
delete from public.bets
where (grp, event_date, team_a, team_b) in (
  ('free','2026-07-03','Benfica','Sporting'),
  ('free','2026-07-03','Real Madrid','Barcelona'),
  ('free','2026-07-11','PSG','Lyon'),
  ('free','2026-07-19','Man City','Arsenal'),
  ('free','2026-08-02','Inter','Juventus'),
  ('free','2026-08-14','Chelsea','Liverpool'),
  ('free','2026-08-28','Dortmund','Bayern'),
  ('vip','2026-07-05','Nápoles','Roma'),
  ('vip','2026-07-15','Atlético','Sevilla'),
  ('vip','2026-08-09','Ajax','PSV'),
  ('vip','2026-08-22','Porto','Braga')
);
