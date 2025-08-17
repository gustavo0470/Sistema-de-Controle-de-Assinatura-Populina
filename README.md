# Sistema de Assinaturas

Sistema completo de gestão de assinaturas com workflow de aprovação, desenvolvido com Next.js 15, Supabase e Prisma.

## ✨ Funcionalidades

### 🔐 Autenticação
- ✅ Login baseado em **username** (não email)
- ✅ Troca obrigatória de senha no primeiro acesso
- ✅ Recuperação de senha via pergunta de segurança
- ✅ Três tipos de usuários: COMMON, ADMIN, SUPPORT

### 👤 Dashboard do Usuário
- ✅ Auto-preenchimento de servidor e setor
- ✅ Criação de assinaturas com motivo e token
- ✅ Listagem com filtros avançados (data, token, busca)
- ✅ Interface responsiva e moderna

### 🛠️ Painel Administrativo
- ✅ CRUD completo de usuários
- ✅ CRUD completo de setores
- ✅ Visualização de todas as assinaturas
- ✅ Estatísticas do sistema

### 💬 Sistema de Chat
- ✅ Chat individual entre usuários
- ✅ Mensagens persistentes
- ✅ Notificações de mensagens não lidas
- ✅ Interface em tempo real

### 👥 Gerenciamento de Perfil
- ✅ Alteração de senha
- ✅ Configuração de pergunta de segurança
- ✅ Visualização de informações pessoais

## 🚀 Tecnologias

- **Frontend/Backend:** Next.js 15 com App Router
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Banco de Dados:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Autenticação:** JWT + bcryptjs
- **Tipografia:** PT Sans + Playfair Display

## 📦 Instalação

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd sistema-assinaturas
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente

⚠️ **IMPORTANTE**: Você deve criar manualmente o arquivo `.env.local` na raiz do projeto.

**Crie o arquivo `.env.local` e cole exatamente o conteúdo abaixo:**

```env
DATABASE_URL="postgresql://postgres.cylgwfynsvzlgskrzyvc:live2017G!@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"

SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5bGd3Znluc3Z6bGdza3J6eXZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM2MDI5MCwiZXhwIjoyMDcwOTM2MjkwfQ.U6H3_TR7LPLAF-InMiErG9k1aM0GsGa61kouTI9yFwI"

NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5bGd3Znluc3Z6bGdza3J6eXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjAyOTAsImV4cCI6MjA3MDkzNjI5MH0.sEkUGsuTC6w4q0ixTjhOYtE7_KzjaiRb8ag7AJwMo_4"

NEXT_PUBLIC_SUPABASE_URL="https://cylgwfynsvzlgskrzyvc.supabase.co"

NEXTAUTH_SECRET="sistema-assinaturas-secret-key-2024"
NEXTAUTH_URL="http://localhost:3000"
```

⚠️ **Passos para criar o arquivo `.env.local`:**
1. Crie um novo arquivo na raiz do projeto (mesmo local do `package.json`)
2. Nomeie o arquivo como `.env.local` (com o ponto no início)
3. Cole exatamente o conteúdo acima (sem alterar nada)
4. Salve o arquivo

💡 **Dica**: Se estiver usando o Notepad, você pode executar `notepad .env.local` no terminal para criar e editar o arquivo.

### 4. Configure o banco de dados

```bash
# Aplicar schema do banco
npx prisma db push --accept-data-loss

# Gerar o cliente Prisma
npx prisma generate

# Popular banco com dados iniciais
npx prisma db seed
```

### 5. Execute o projeto

```bash
npm run dev
```

O sistema estará disponível em `http://localhost:3000`

## 👥 Usuários Padrão

### Usuário de Suporte (Obrigatório)
- **Username:** `gustavo`
- **Senha:** `live2017G!`
- **Papel:** SUPPORT
- **Setor:** Suporte TI
- **Primeiro Login:** Não (já configurado)

### Setores Padrão
1. **Suporte TI** - Setor de Tecnologia da Informação
2. **Administração** - Setor Administrativo  
3. **Financeiro** - Setor Financeiro

## 🎯 Como Usar

### 1. Primeiro Acesso
1. Acesse `http://localhost:3000`
2. Faça login com o usuário `gustavo` / `live2017G!`
3. Você será direcionado para o painel administrativo

### 2. Criar Usuários
1. No painel admin, vá em "Usuários"
2. Clique em "Criar Usuário"
3. Preencha os dados (username, nome, senha, papel, setor)
4. O usuário criado precisará trocar a senha no primeiro login

### 3. Criar Assinaturas
1. Usuários comuns acessam o Dashboard
2. Preenchem motivo e token (servidor/setor são automáticos)
3. A assinatura é criada com timestamp atual

### 4. Usar Chat
1. Clique em "Chat" no menu lateral
2. Clique em "Nova Conversa" para selecionar usuário
3. Digite e envie mensagens
4. Mensagens são persistentes e mostram status de leitura

## 🔥 **Como Testar as Correções Implementadas**

### **1. Edição/Exclusão Direta (Admin/Suporte)**
- **Login**: `gustavo` / `live2017G!`
- **Assinaturas**: Clique "Editar" ou "Excluir" → Ação imediata
- **Usuários**: Admin → Usuários → Clique "Editar" ou "Excluir" 
- **Setores**: Admin → Setores → Clique "Editar" ou "Excluir"

### **2. Chat em Tempo Real com Visitantes**
- **Abra** `/chat-support` em aba anônima (sem login)
- **Inicie** conversa com username/nome → Envie mensagem
- **No admin autenticado**, acesse Chat → Veja mensagem aparecer
- **Responda** como admin → Guest verá resposta automaticamente

### **3. Sistema de Notificações Completo**
- **Acesse** aba "Notificações" → Veja mensagens e solicitações
- **Teste** filtros (todas/não lidas/lidas)
- **Marque** como lida individualmente ou todas de vez

### **4. Sistema de Solicitações Dual**
- **Crie** usuário comum → Login como usuário comum
- **Crie** assinatura → Clique "Solicitar edição/exclusão"
- **Login** como admin → "Admin" → "Solicitações" → Aprove/Rejeite
- **Compare** com botões diretos do admin (sem solicitação)

### **5. Dropdowns Inteligentes**
- **Dashboard**: Veja dropdown de tokens (com opção "Adicionar novo")
- **Filtros**: Selecione tokens em vez de digitar
- **Validação**: Pergunta de segurança obrigatória na recuperação

## 🗄️ Estrutura do Banco

### Tabelas Principais
- **users** - Usuários do sistema
- **sectors** - Setores da organização
- **signatures** - Assinaturas criadas
- **requests** - Solicitações de edição/exclusão (futuro)
- **chat_messages** - Mensagens do chat

### Auto-preenchimento
- `serverName` = nome do usuário logado
- `sectorName` = nome do setor do usuário
- `createdAt` = timestamp automático

## 🎨 Design System

### Cores Principais
- **Primária:** Azul (#3b82f6)
- **Sucesso:** Verde (#10b981)
- **Aviso:** Amarelo (#f59e0b)
- **Erro:** Vermelho (#ef4444)

### Tipografia
- **Corpo:** PT Sans (400, 700)
- **Títulos:** Playfair Display (400-900)

### Componentes
- Botões com estados hover e loading
- Cards com sombras sutis
- Tabelas responsivas
- Modais para ações importantes
- Badges para status e papéis

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:
- **Desktop:** Layout completo com sidebar
- **Tablet:** Layout adaptado com navegação colapsável
- **Mobile:** Interface otimizada para toque

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build
npm start

# Banco de dados
npm run db:push     # Aplicar mudanças no schema
npm run db:seed     # Popular com dados iniciais

# Linting
npm run lint
```

## 🚦 Status do Projeto

### ✅ Concluído
- ✅ Sistema de autenticação completo com username/senha
- ✅ Dashboard do usuário com auto-preenchimento total
- ✅ Painel administrativo completo (usuários, setores, solicitações)
- ✅ Sistema de chat com restrições (usuários comuns só falam com admin/suporte)
- ✅ Chat público REAL em tempo real conectado com admin/suporte
- ✅ Sistema completo de solicitações de edição/exclusão de assinaturas
- ✅ Workflow de aprovação para administradores
- ✅ Edição e exclusão DIRETA de assinaturas para admin/suporte
- ✅ Edição e exclusão funcional de usuários e setores
- ✅ Filtros selecionáveis (dropdowns) para tokens e setores
- ✅ Validação correta de pergunta de segurança
- ✅ Sistema de notificações em aba separada (não apenas badge)
- ✅ Marca d'água no rodapé
- ✅ Interface totalmente responsiva
- ✅ Configuração de perfil e segurança
- ✅ Correção de TODOS os bugs críticos (params.id, cookies, cliques, etc.)

### 🎯 Funcionalidades Implementadas

#### **Sistema de Permissões Dual**
- **Usuários Comuns**: Solicitam edição/exclusão → Aguardam aprovação
- **Admin/Suporte**: Editam/excluem diretamente → Ação imediata

#### **Chat em Tempo Real**
- **Chat Restrito**: Usuários comuns só conversam com admin/suporte
- **Chat Público**: Visitantes podem iniciar conversa sem login
- **Integração Real**: Mensagens de guests aparecem no chat do admin
- **Polling Automático**: Atualização a cada 5 segundos

#### **Sistema de Notificações Completo**
- **Aba Separada**: `/notifications` com filtros (todas/não lidas/lidas)
- **Contador Visual**: Badge no ícone de notificações
- **Tipos Diversos**: Mensagens de chat + solicitações pendentes
- **Marcar como Lida**: Individual ou todas de uma vez

#### **Funcionalidades Avançadas**
- **Dropdowns Inteligentes**: Tokens pré-cadastrados + opção "novo"
- **Validação de Segurança**: Pergunta obrigatória na recuperação
- **Auto-preenchimento**: Servidor, setor, data/hora automáticos
- **Marca d'Água**: Rodapé fixo em todas as páginas
- **Interface Adaptativa**: Botões mudam conforme permissão do usuário

### 🚧 Melhorias Futuras
- WebSockets para notificações em tempo real
- Sistema de relatórios e exportação
- Cache para melhor performance
- Logs de auditoria detalhados

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique se todas as dependências foram instaladas
2. Confirme que o arquivo `.env.local` está configurado
3. Execute `npx prisma db push` para sincronizar o banco
4. Entre em contato com o desenvolvedor se o problema persistir

---

**Desenvolvido com ❤️ usando Next.js + Supabase + Prisma**
