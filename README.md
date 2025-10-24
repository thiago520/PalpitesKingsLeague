# Kings League Palpites – MVP

## Pré-requisitos
- Node 18+
- Banco Postgres (pode usar Supabase/Neon)

## Setup
1. `cp .env.example .env` e preencha `DATABASE_URL`, `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `OAUTH_REDIRECT_URI`.
2. `npm i`
3. `npx prisma migrate dev`
4. Cadastre times/aliases e partidas (Prisma Studio: `npx prisma studio`).
5. Rode o app: `npm run dev` (abre em http://localhost:3000)
6. Rode o worker de chat em outro terminal: `npm run worker:dev`

## Uso
- Entre com Twitch (topo da home)
- Abra uma partida e clique **Iniciar palpites**
- No chat do streamer, os viewers podem enviar mensagens no formato: `G3X 7 x 2 Furia`
- Lance o resultado via `POST /api/matches/:id/result` (ou crie um form no admin)
- Veja o ranking em `/api/leaderboard`

## Observações
- MVP usa IRC (tmi.js). Futuramente, migrar leitura para **EventSub (channel.chat.message)**.
- Escopo mínimo requisitado: `chat:read`.
- Tokens não são cifrados (apenas MVP). Em produção, cifrar/restingir acesso, e rotacionar segredos.
No passo a passo, depois das migrações, inclua:


```bash
npx prisma db seed
# ou
npm run seed