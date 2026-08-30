-- Dados de exemplo (opcional). Corre depois de 0001_init.sql para testar os graficos.
insert into public.bets (grp, event_date, team_a, team_b, market, odd, stake, return_amount, status) values
  ('free','2026-07-03','Benfica','Sporting','Mais de 2.5 golos',1.85,20,37,'green'),
  ('free','2026-07-03','Real Madrid','Barcelona','1X2 - Casa',2.10,15,0,'red'),
  ('free','2026-07-11','PSG','Lyon','Ambas marcam - Sim',1.72,25,43,'green'),
  ('free','2026-07-19','Man City','Arsenal','Menos de 3.5 golos',1.55,30,46.5,'green'),
  ('free','2026-08-02','Inter','Juventus','Empate',3.20,10,0,'red'),
  ('free','2026-08-14','Chelsea','Liverpool','Dupla hipotese X2',1.45,40,58,'green'),
  ('free','2026-08-28','Dortmund','Bayern','Handicap +1.5',1.90,20,0,'pending'),
  ('vip','2026-07-05','Nápoles','Roma','Mais de 1.5 golos',1.30,50,65,'green'),
  ('vip','2026-07-15','Atlético','Sevilla','1X2 - Casa',1.75,40,70,'green'),
  ('vip','2026-08-09','Ajax','PSV','Ambas marcam - Sim',1.65,45,0,'red'),
  ('vip','2026-08-22','Porto','Braga','Mais de 2.5 golos',1.95,35,68.25,'green');
