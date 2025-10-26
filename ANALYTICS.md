# 📊 Analytics Dashboard - Kings League Palpites

## Visão Geral

Foi criada uma nova página de **Analytics** com gráficos em pizza e barra que visualiza os dados dos palpites da Kings League. A página está disponível em `/analytics` e pode ser acessada através da navegação principal.

## 🎯 Funcionalidades Implementadas

### **Gráficos em Pizza:**
1. **Taxa de Acerto dos Palpites**: Mostra a proporção entre acertos e erros
2. **Distribuição de Palpites por Resultado**: Vitória casa vs visitante vs empate
3. **Status das Partidas**: Distribuição por DRAFT, OPEN, LOCKED, FINISHED

### **Gráficos em Barra:**
1. **Top 10 Usuários por Pontuação**: Ranking com pontos e número de palpites
2. **Distribuição de Partidas por Região**: Quantidade de partidas por país/região

### **Gráfico de Linha:**
1. **Palpites ao Longo do Tempo**: Evolução de palpites nos últimos 30 dias

### **Cards de Resumo:**
- Total de Palpites
- Taxa de Acerto percentual
- Usuários Ativos
- Total de Partidas

## 🔧 Tecnologias Utilizadas

- **Recharts**: Biblioteca de gráficos responsiva para React
- **Tailwind CSS**: Estilização moderna e responsiva
- **Prisma**: Consultas complexas ao banco de dados
- **TypeScript**: Tipagem forte para maior confiabilidade

## 📁 Estrutura de Arquivos

```
app/analytics/
├── page.tsx              # Página principal com consultas ao banco
└── ui/
    └── AnalyticsClientSimple.tsx  # Componente cliente com gráficos
```

## 🚀 Como Usar

1. **Acesso**: Faça login e clique em "📊 Analytics" na navegação
2. **Navegação**: Use as abas para alternar entre diferentes visualizações:
   - **📊 Visão Geral**: Gráficos de pizza principais
   - **👥 Usuários**: Ranking de usuários
   - **⚽ Partidas**: Análise de partidas por região
   - **📈 Tendências**: Evolução temporal dos palpites

## 💾 Dados Analisados

### **Consultas Realizadas:**
- Agregação de palpites por resultado e precisão
- Ranking de usuários por pontuação
- Distribuição de partidas por status e região
- Análise temporal de atividade de palpites

### **Filtros Disponíveis:**
- Por canal/streamer específico (via parâmetro `?channel=@nome`)
- Limitação de dados para performance (últimos 1000 palpites)
- Foco nos últimos 30 dias para tendências temporais

## 🎨 Design Responsivo

- **Desktop**: Layout em grid 2x2 para gráficos maiores
- **Mobile**: Layout em coluna única adaptativo
- **Tema escuro**: Consistente com o resto da aplicação
- **Cores temáticas**: Verde (acertos), vermelho (erros), azul (informações)

## 🔮 Possibilidades de Expansão

### **Gráficos Adicionais:**
- Heatmap de atividade por hora/dia da semana
- Análise de placares mais apostados vs reais
- Performance por streamer individual
- Comparativo de regiões (precisão, atividade)

### **Filtros Avançados:**
- Período customizado (data início/fim)
- Filtro por time específico
- Análise por rodada da competição
- Segmentação por tipo de usuário (novatos vs veteranos)

### **Métricas Avançadas:**
- Streak de acertos/erros
- Confiabilidade por tipo de aposta (favorito vs azarão)
- Análise de bias (tendência a apostar em casa/visitante)
- ROI simulado se fosse apostas reais

## 📊 Exemplos de Insights Possíveis

1. **"70% dos palpites apostam na vitória da casa"**
2. **"Usuários com mais de 10 palpites têm 45% de precisão"**
3. **"Região BR tem maior atividade às 20h"**
4. **"Times com código de 3 letras recebem mais palpites"**

## 🛠️ Manutenção

- Os dados são calculados em tempo real a cada acesso
- Cache pode ser implementado para melhor performance
- Considerar paginação se o volume de dados crescer muito
- Monitorar performance das queries agregadas

---

**Próximos Passos Sugeridos:**
1. Implementar cache Redis para consultas pesadas
2. Adicionar export de dados (CSV, PDF)
3. Criar sistema de alertas para métricas importantes
4. Implementar analytics em tempo real com WebSockets