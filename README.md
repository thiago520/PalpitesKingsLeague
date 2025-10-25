# Kings League Palpites – MVP

## Pré-requisitos
- Node 18+
- Banco Postgres (pode usar Supabase/Neon)

## Setup Rápido 🚀

### Opção 1: Script Automático
```bash
./setup-local.sh
```

### Opção 2: Manual
1. `cp .env.example .env` e configure credenciais Twitch
2. `npm install`
3. `docker-compose up -d db` (inicia PostgreSQL)
4. `npx prisma migrate dev`
5. `npx prisma db seed`
6. `npm run dev` (aplicação principal)
7. `npm run worker:dev` (worker de chat - terminal separado)

**📖 Guia detalhado:** [LOCAL-SETUP.md](LOCAL-SETUP.md)

## Uso
- **Login**: Entre com Twitch (topo da home)
- **Partidas**: Abra uma partida e clique **"Iniciar palpites"**
- **Palpites**: Viewers enviam no chat: `G3X 7 x 2 Furia`
- **Resultado**: Lance via `POST /api/matches/:id/result` ou admin
- **Ranking**: Veja em `/ranking`
- **📊 Analytics**: Novos gráficos em `/analytics` 🎉
- **Novo**: Acesse analytics com gráficos em `/analytics` 📊

## Funcionalidades
- ✅ Sistema de palpites via chat Twitch
- ✅ Ranking de usuários por pontuação
- ✅ Administração de partidas e times
- ✅ **Dashboard de analytics com gráficos em pizza e barra**
- ✅ Suporte multi-streamer/canal
- ✅ Interface responsiva com tema escuro

## Observações
- MVP usa IRC (tmi.js). Futuramente, migrar leitura para **EventSub (channel.chat.message)**.
- Escopo mínimo requisitado: `chat:read`.
- Tokens não são cifrados (apenas MVP). Em produção, cifrar/restingir acesso, e rotacionar segredos.
No passo a passo, depois das migrações, inclua:


```bash
npx prisma db seed
# ou
npm run seed