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