#!/bin/bash

echo "🚀 Kings League Palpites - Setup Local"
echo "======================================"

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker e tente novamente."
    exit 1
fi

echo "📦 Instalando dependências..."
npm install

echo "🐳 Subindo banco PostgreSQL..."
docker-compose up -d db

echo "⏳ Aguardando banco inicializar..."
sleep 5

echo "🗄️  Executando migrações do Prisma..."
npx prisma migrate dev --name init

echo "🌱 Populando banco com dados iniciais..."
npx prisma db seed

echo ""
echo "✅ Setup concluído com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure suas credenciais do Twitch no arquivo .env"
echo "   - TWITCH_CLIENT_ID"
echo "   - TWITCH_CLIENT_SECRET"
echo ""
echo "2. Para criar um app Twitch, acesse:"
echo "   https://dev.twitch.tv/console/apps"
echo ""
echo "3. Configure o Redirect URL como:"
echo "   http://localhost:3000/api/auth/twitch/callback"
echo ""
echo "4. Execute o projeto:"
echo "   npm run dev"
echo ""
echo "5. Execute o worker de chat em outro terminal:"
echo "   npm run worker:dev"
echo ""
echo "🌐 Aplicação: http://localhost:3000"
echo "📊 Prisma Studio: npx prisma studio"
echo "🗃️  Banco: postgresql://postgres:postgres@localhost:5432/kings"