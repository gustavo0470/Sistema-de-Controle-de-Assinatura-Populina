# Deploy no Vercel

## 1. Preparação

1. Faça commit de todas as mudanças:
```bash
git add .
git commit -m "Preparar para deploy"
git push origin main
```

2. Instale a CLI do Vercel:
```bash
npm i -g vercel
```

## 2. Deploy via Dashboard

### Opção A - GitHub (Recomendado)
1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub
3. Clique "New Project"
4. Importe seu repositório
5. Configure as variáveis de ambiente (ver seção abaixo)
6. Deploy automático

### Opção B - CLI
```bash
vercel login
vercel
# Siga as instruções
```

## 3. Variáveis de Ambiente

No dashboard do Vercel, vá em **Settings > Environment Variables** e adicione:

```env
DATABASE_URL=postgresql://postgres:<senha>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua-chave-anon>
SUPABASE_SERVICE_ROLE_KEY=<sua-chave-service-role>
NEXTAUTH_SECRET=<seu-secret-aleatorio>
NEXTAUTH_URL=https://<seu-dominio>.vercel.app
```

⚠️ **IMPORTANTE**: Use a URL de conexão DIRETA do Supabase (porta 5432), não o pooler (porta 6543).

## 4. Configurações do Projeto

- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node.js Version**: 18.x ou superior

## 5. Após o Deploy

1. Teste todas as funcionalidades:
   - Login/logout
   - Criação de assinaturas
   - Chat com visitantes
   - Exportação Excel
   - Notificações

2. Configure domínio customizado (opcional):
   - Settings > Domains
   - Configure DNS conforme instruções

## 6. Monitoramento

- **Analytics** no dashboard
- **Functions** para logs das APIs  
- **Speed Insights** para performance

## 7. Troubleshooting

### Erro de build:
- Verifique se todas as dependências estão em `package.json`
- Confirme se o TypeScript compila localmente: `npm run build`

### Erro de runtime:
- Verifique as variáveis de ambiente
- Confirme se o Supabase está acessível
- Use logs do Vercel Functions para debug

### Performance:
- APIs são otimizadas automaticamente
- Edge Functions disponíveis se necessário

## 8. Deploy Automático

Cada push para `main` faz deploy automático.
Para desabilitar: Settings > Git > Auto-deploy (off)
