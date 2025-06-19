# 🍽️ Meal Tracker - Sistema de Rastreamento de Refeições

Um sistema completo para rastreamento de refeições e análise nutricional, desenvolvido com Next.js 14, TypeScript e SQLite.

## 📋 Índice

- [Características](#características)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [API Endpoints](#api-endpoints)
- [Banco de Dados](#banco-de-dados)
- [Contribuição](#contribuição)
- [Licença](#licença)

## ✨ Características

### 🔐 Autenticação e Segurança
- Sistema de autenticação JWT com cookies seguros
- Controle de acesso baseado em usuário
- Sessões com expiração automática
- Proteção CSRF e validação de entrada

### 📊 Rastreamento Nutricional
- Busca automática de alimentos via API Nutritionix
- Tradução automática PT-BR ↔ EN via DeepL
- Cálculo automático de macronutrientes
- Suporte a diferentes unidades de medida
- Histórico completo de refeições

### 📈 Análise e Relatórios
- Dashboard com visão geral diária
- Relatórios mensais detalhados
- Gráficos de distribuição de macronutrientes
- Análise de aderência às metas calóricas
- Calendário visual com indicadores

### 🎨 Interface do Usuário
- Design responsivo e moderno
- Tema escuro otimizado
- Componentes reutilizáveis
- Experiência de usuário intuitiva
- Feedback visual em tempo real

## 🛠️ Tecnologias

### Frontend
- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **Chart.js** - Visualização de dados
- **Zustand** - Gerenciamento de estado
- **date-fns** - Manipulação de datas

### Backend
- **Next.js API Routes** - Endpoints RESTful
- **SQLite** - Banco de dados local
- **better-sqlite3** - Driver SQLite otimizado
- **bcryptjs** - Hash de senhas
- **jose** - JWT tokens

### APIs Externas
- **Nutritionix API** - Dados nutricionais
- **DeepL API** - Tradução automática

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Chaves de API (Nutritionix e DeepL)

## 🚀 Instalação

1. **Clone o repositório**
\`\`\`bash
git clone https://github.com/seu-usuario/meal-tracker.git
cd meal-tracker
\`\`\`

2. **Instale as dependências**
\`\`\`bash
npm i --legacy-peer-deps
\`\`\`

3. **Configure as variáveis de ambiente**
\`\`\`bash
cp .env.example .env.local
\`\`\`

4. **Edite o arquivo `.env.local`**
\`\`\`env
# APIs
NUTRITIONIX_API_KEY = 446afa0bf42bc57d26b8a194f376d464
NUTRITIONIX_APP_ID = c454b796
DEEPL_API_KEY = abfa482a-c23f-46cc-9f21-443d88fc881e:fx

# Segurança
JWT_SECRET=sua_chave_secreta_jwt_muito_segura
\`\`\`

5. **Inicialize o banco de dados**
\`\`\`bash
node scripts/init-db.js
\`\`\`

6. **Execute o projeto**
\`\`\`bash
npm run dev
\`\`\`

7. **Acesse a aplicação**
\`\`\`
http://localhost:3000
\`\`\`

## ⚙️ Configuração

### Chaves de API

#### Nutritionix API
1. Registre-se em [developer.nutritionix.com](https://developer.nutritionix.com)
2. Crie uma aplicação
3. Copie `Application ID` e `Application Key`

#### DeepL API
1. Registre-se em [deepl.com/pro](https://www.deepl.com/pro)
2. Acesse o painel de desenvolvedor
3. Copie a chave de API

### Banco de Dados

O sistema usa SQLite com as seguintes tabelas:
- `users` - Dados dos usuários
- `meals` - Refeições registradas
- `servings` - Informações de porções
- `alt_measures` - Medidas alternativas
- `sessions` - Sessões de usuário

### Usuário Demo

O sistema inclui um usuário de demonstração:
- **Email:** demo@example.com
- **Senha:** demo123

## 📖 Uso

### 1. Autenticação
- Acesse `/login` para entrar
- Acesse `/signup` para criar conta
- Use as credenciais demo para teste

### 2. Adicionando Refeições
1. Selecione uma data no calendário
2. Clique em "Adicionar Refeições"
3. Busque alimentos ou adicione manualmente
4. Ajuste porções e tipo de refeição
5. Salve a refeição

### 3. Visualizando Dados
- **Dashboard:** Visão geral com gráficos
- **Relatórios:** Análise mensal detalhada
- **Calendário:** Navegação por datas

### 4. Editando Refeições
1. Clique no ícone de edição
2. Modifique os dados necessários
3. Salve as alterações

## 🔌 API Endpoints

### Autenticação
\`\`\`
POST /api/auth/login      # Login
POST /api/auth/signup     # Cadastro
POST /api/auth/logout     # Logout
GET  /api/auth/me         # Dados do usuário
\`\`\`

### Refeições
\`\`\`
GET    /api/meals         # Listar refeições
POST   /api/meals         # Criar refeição
GET    /api/meals/[id]    # Obter refeição
PUT    /api/meals/[id]    # Atualizar refeição
DELETE /api/meals/[id]    # Deletar refeição
\`\`\`

### Nutritionix
\`\`\`
POST /api/nutritionix/search     # Buscar alimentos
POST /api/nutritionix/nutrients  # Obter nutrientes
POST /api/nutritionix/measure    # Calcular por medida
\`\`\`

### Parâmetros de Query
\`\`\`
GET /api/meals?date=2024-01-15        # Refeições de uma data
GET /api/meals?month=2024-01          # Refeições de um mês
\`\`\`

## 🗄️ Banco de Dados

### Schema Principal

#### Tabela `users`
\`\`\`sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

#### Tabela `meals`
\`\`\`sql
CREATE TABLE meals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  name TEXT NOT NULL,
  original_name TEXT,
  calories INTEGER NOT NULL,
  protein REAL NOT NULL,
  carbs REAL NOT NULL,
  fat REAL NOT NULL,
  meal_type TEXT NOT NULL,
  food_id TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
\`\`\`

### Relacionamentos
- Um usuário pode ter muitas refeições
- Uma refeição pode ter uma porção
- Uma refeição pode ter várias medidas alternativas

## 🔧 Desenvolvimento

### Scripts Disponíveis
\`\`\`bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Servidor de produção
npm run lint         # Verificação de código
\`\`\`

### Estrutura de Componentes
\`\`\`typescript
// Exemplo de componente tipado
interface MealProps {
  meal: Meal
  onEdit: (meal: Meal) => void
  onDelete: (id: number) => void
}

export function MealCard({ meal, onEdit, onDelete }: MealProps) {
  // Implementação do componente
}
\`\`\`

### Gerenciamento de Estado
\`\`\`typescript
// Store Zustand
export const useMealStore = create<MealStore>((set, get) => ({
  meals: [],
  loading: false,
  error: null,
  fetchMeals: async () => {
    // Lógica de busca
  }
}))
\`\`\`

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático

### Docker
\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

## 🧪 Testes

### Estrutura de Testes
\`\`\`bash
# Executar testes
npm test

# Testes com cobertura
npm run test:coverage

# Testes E2E
npm run test:e2e
\`\`\`

## 🔒 Segurança

### Medidas Implementadas
- Autenticação JWT com cookies httpOnly
- Hash de senhas com bcrypt
- Validação de entrada em todas as APIs
- Proteção contra SQL injection
- Rate limiting nas APIs externas
- Sanitização de dados do usuário

### Boas Práticas
- Senhas devem ter pelo menos 6 caracteres
- Sessões expiram em 24 horas
- Logs de segurança para ações críticas
- Validação de tipos TypeScript

## 📊 Monitoramento

### Logs
- Logs estruturados para debugging
- Rastreamento de erros de API
- Métricas de performance

### Métricas
- Tempo de resposta das APIs
- Taxa de sucesso das traduções
- Uso da API Nutritionix

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código
- Use TypeScript para tipagem
- Siga as convenções do ESLint
- Escreva testes para novas features
- Documente APIs e componentes

## 🐛 Problemas Conhecidos

- [ ] Cache de tradução para melhor performance
- [ ] Suporte offline limitado
- [ ] Exportação de dados em PDF

## 🔮 Roadmap

- [ ] App mobile React Native
- [ ] Integração com wearables
- [ ] IA para sugestões nutricionais
- [ ] Compartilhamento social
- [ ] API pública

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 Autores

- **Francielly Dias Macedo**
- **Juan Tavares Marcolino Lirio**
- **Kaylane Simões dos Santos**
- **Maria Eduarda Lopes Constantino**
- **Mylena Leite Bortolozzo**
- **Pierry Jonny Belarmino Andrade**

## 🙏 Agradecimentos

- [Nutritionix](https://www.nutritionix.com/) pela API de dados nutricionais
- [DeepL](https://www.deepl.com/) pela API de tradução
- [Vercel](https://vercel.com/) pela plataforma de deploy
- Comunidade Next.js pelo framework incrível

---

**🌟 Gostou do projeto?** Deixe uma estrela no repositório!
