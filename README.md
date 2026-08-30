# Planilha PEDRITO — Apostas

App React + TypeScript + Supabase com **duas planilhas** de apontamento de apostas:
grupo **Grátis** e grupo **VIP**. A página é **pública e apenas de leitura**; só o
administrador entra (email/password) para editar. Atualiza em **tempo real** para todos.

## Funcionalidades

- Registo de aposta: Equipa A vs Equipa B, mercado, odd, valor, retorno, estado
  (pendente / green / red / anulada). Lucro calculado automaticamente.
- Seletor Grátis / VIP no topo. Link partilhável (`?grupo=free` ou `?grupo=vip`).
- Estatísticas: P/L, ROI, banca e evolução, taxa de vitória, nº greens/reds/pendentes,
  sequência atual, odd média, aposta média, maior green, maior red, total investido.
- **Gráfico interativo com drill-down**: Tudo → Ano → Mês → Dia.
  Cada nível mostra o P/L por período + evolução da banca; clicar aprofunda; a tabela
  de apostas por baixo acompanha o nível selecionado.

## Setup

### 1. Supabase

1. Cria um projeto novo em https://supabase.com.
2. SQL Editor → cola e corre [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   (opcional: corre também `supabase/seed.sql` para dados de teste.)
3. Authentication → Providers → Email: **desativa** "Confirm email" e desativa registos
   públicos se quiseres. Authentication → Users → **Add user**: cria o utilizador
   admin (email + password). Só este consegue editar.
4. Project Settings → API: copia `Project URL` e a chave `anon public`.

### 2. App

```bash
cp .env.example .env      # preenche VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

### 3. Deploy (Vercel)

- Importa o repositório na Vercel (framework: **Vite**).
- Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- `vercel.json` já trata do fallback SPA.
- Partilha o URL — abre em modo leitura. O admin clica em **Admin** e entra.

## Segurança

As políticas RLS permitem `SELECT` a todos e `INSERT/UPDATE/DELETE` apenas a
utilizadores autenticados. Não cries mais nenhum utilizador em Supabase Auth além
do(s) admin(s).

## Stack

Vite · React 19 · TypeScript · Tailwind CSS · Recharts · Supabase (Postgres + Auth + Realtime)

# elpedritoplanilhas
