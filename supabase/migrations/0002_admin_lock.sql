-- Restringe a escrita ao(s) email(s) de administrador, mesmo que existam
-- outros utilizadores autenticados no projeto.

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') = any (array[
    'elpedritomembros@gmail.com'
  ]);
$$;

drop policy if exists "bets_admin_write" on public.bets;
create policy "bets_admin_write" on public.bets for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "settings_admin_write" on public.settings;
create policy "settings_admin_write" on public.settings for all
  to authenticated using (public.is_admin()) with check (public.is_admin());
