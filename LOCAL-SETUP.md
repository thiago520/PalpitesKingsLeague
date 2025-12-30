# 🚀 Desenvolvimento Local - Kings League Palpites

## ✅ Setup Concluído!

O ambiente local foi configurado com sucesso. Aqui está o resumo:

### 📊 **Status Atual:**
- ✅ Dependências instaladas (`npm install`)
- ✅ Banco PostgreSQL configurado
- ✅ Migrações aplicadas (`prisma migrate`)
- ✅ Dados iniciais inseridos (`prisma db seed`)
- ✅ Página Analytics implementada com gráficos

---

## 🔧 **Configuração Final Necessária**

### **1. Configurar OAuth do Twitch:**

Edite o arquivo `.env` e substitua:

```bash
TWITCH_CLIENT_ID="seu_client_id_aqui"
TWITCH_CLIENT_SECRET="seu_client_secret_aqui"

# (Opcional) Bot para enviar mensagens no chat
TWITCH_BOT_ENABLED="true"
TWITCH_BOT_USERNAME="PalpitesKings"
OAUTH_BOT_REDIRECT_URI="http://localhost:3000/api/auth/twitch/bot/callback"

# Autorize o bot (logado como admin):
# http://localhost:3000/api/auth/twitch/bot/login
```

### **2. Como obter credenciais Twitch:**

1. Acesse: https://dev.twitch.tv/console/apps
2. Clique em **"Register Your Application"**
3. Preencha:
   - **Name**: `Kings League Palpites Local`
   - **OAuth Redirect URLs**: `http://localhost:3000/api/auth/twitch/callback`
   - **Category**: `Website Integration`
4. Após criar, copie o **Client ID** e **Client Secret**

---

## 🚀 **Como Executar**

### **Terminal 1 - Aplicação Principal:**
```bash
npm run dev
```

### **Terminal 2 - Worker de Chat:**
```bash
npm run worker:dev
```

### **Terminal 3 - Prisma Studio (opcional):**
```bash
npx prisma studio
```

---

## 🌐 **URLs Importantes**

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Aplicação** | http://localhost:3000 | Interface principal |
| **Analytics** | http://localhost:3000/analytics | Página com gráficos 📊 |
| **Prisma Studio** | http://localhost:5555 | Interface do banco |
| **Banco PostgreSQL** | localhost:5432 | Conexão direta |

---

## 📊 **Funcionalidades Disponíveis**

### **✅ Já Funcionais:**
- 🔐 Login via Twitch
- ⚽ Cadastro de partidas (admin)
- 🎯 Sistema de palpites via chat
- 🏆 Ranking de usuários
- 📊 **Analytics com gráficos** (NOVO!)

### **📊 Gráficos Implementados:**
- 🥧 **Pizza**: Taxa de acerto, distribuição de resultados
- 📊 **Barras**: Top usuários, partidas por região  
- 📈 **Linha**: Evolução temporal de palpites

---

## 🗃️ **Banco de Dados**

### **Conexão:**
```
Host: localhost
Port: 5432
Database: kings
User: postgres  
Password: postgres
```

### **Tabelas Principais:**
- `Team` - Times das ligas
- `Match` - Partidas
- `User` - Usuários do Twitch
- `Guess` - Palpites dos usuários
- `Result` - Resultados das partidas

---

## 🐛 **Troubleshooting**

### **Erro: "Port 5432 already allocated"**
```bash
# Parar outros PostgreSQL
sudo systemctl stop postgresql
# ou
docker stop $(docker ps -q --filter "ancestor=postgres")
```

### **Erro: "DATABASE_URL not found"**
```bash
# Verifique se o arquivo .env existe e está configurado
ls -la .env
cat .env
```

### **Erro: Prisma não conecta**
```bash
# Reset do banco
npx prisma migrate reset
npx prisma db seed
```

---

## 📝 **Próximos Passos**

1. **Configure as credenciais do Twitch** 
2. **Execute `npm run dev`**
3. **Teste o login** via Twitch
4. **Acesse `/analytics`** para ver os gráficos
5. **Use `/admin`** para cadastrar partidas
6. **Inicie capturas** de palpites nas partidas

---

## 🎯 **Fluxo de Uso Completo**

1. **Admin**: Cadastra times e partidas
2. **Streamer**: Faz login e inicia captura em uma partida  
3. **Viewers**: Enviam palpites no chat (`G3X 2 x 1 Team`)
4. **Admin**: Lança resultado da partida
5. **Sistema**: Calcula pontos automaticamente
6. **Analytics**: Visualiza estatísticas nos gráficos 📊

---

**🎉 Ambiente pronto para desenvolvimento!**