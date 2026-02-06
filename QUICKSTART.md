# 🚀 Guia Rápido - Sistema AX Festas com Autenticação

## ✅ O que foi implementado

Este PR adiciona autenticação completa ao Sistema AX Festas, tornando-o privado e seguro:

1. **Sistema de Login** - Página de login em `/login`
2. **Gerenciamento de Usuários** - Interface admin para adicionar/remover usuários
3. **Proteção de Rotas** - Todas as áreas admin protegidas por autenticação
4. **Exibição de Dados do Airtable** - Catálogo e inventário agora mostram dados reais

## 📋 Configuração Inicial (5 passos)

### Passo 1: Criar Tabela Users no Airtable

Crie uma nova tabela chamada **"Users"** com os seguintes campos:

| Campo | Tipo | Exemplo |
|-------|------|---------|
| username | Single line text | admin |
| password | Single line text | $2a$10$... |
| role | Single select | admin, user |
| name | Single line text | Administrador |
| email | Email | admin@axfestas.com |

### Passo 2: Gerar Senha do Admin

```bash
# No seu computador local
cd sistema.ax
npm install
node scripts/create-admin.js
```

**IMPORTANTE**: Antes de rodar, abra `scripts/create-admin.js` e **altere a senha padrão** para uma senha forte!

O script vai gerar uma senha hasheada. Copie-a.

### Passo 3: Adicionar Admin no Airtable

1. Abra a tabela "Users" no Airtable
2. Adicione um novo registro:
   - **username**: `admin`
   - **password**: Cole a senha hasheada do passo anterior
   - **role**: `admin`
   - **name**: Seu nome (opcional)
   - **email**: Seu email (opcional)

### Passo 4: Configurar Variáveis de Ambiente

No **Cloudflare Pages Dashboard**:

1. Vá em Settings → Environment Variables
2. Adicione (para Production e Preview):

```
AIRTABLE_API_KEY = seu_api_key_aqui
AIRTABLE_BASE_ID = seu_base_id_aqui
AIRTABLE_USERS_TABLE = Users
AIRTABLE_ITEMS_TABLE = Items
AIRTABLE_RESERVATIONS_TABLE = Reservations
AIRTABLE_MAINTENANCE_TABLE = Maintenance
AIRTABLE_FINANCE_TABLE = Finance
```

### Passo 5: Deploy e Testar

1. Faça merge deste PR
2. Cloudflare Pages vai fazer deploy automaticamente
3. Acesse `seu-site.pages.dev/login`
4. Entre com:
   - **Usuário**: `admin`
   - **Senha**: A senha que você definiu no script

## 🎯 Como Usar

### Fazer Login

1. Acesse `/login`
2. Digite usuário e senha
3. Você será redirecionado para `/admin`

### Adicionar Novos Usuários

1. Faça login como admin
2. Vá em **Admin** → **Usuários**
3. Clique em **"Adicionar Usuário"**
4. Preencha o formulário
5. Escolha a função: **Admin** (acesso total) ou **Usuário** (acesso limitado)

### Ver Itens do Airtable

- **Catálogo Público**: `/catalog` - Mostra itens disponíveis
- **Admin → Estoque**: `/admin/inventory` - Mostra todos os itens

## 🔐 Segurança

✅ **O que está protegido:**
- Senhas hasheadas com bcrypt
- Todas as rotas admin protegidas
- API de usuários com validação

⚠️ **Limitação atual:**
- Autenticação client-side (localStorage)
- Para produção pública, recomenda-se JWT/sessions server-side

## 📚 Documentação Completa

- **[AUTHENTICATION_SETUP.md](./AUTHENTICATION_SETUP.md)** - Guia detalhado de configuração
- **[README.md](./README.md)** - Documentação geral do projeto

## 🆘 Problemas Comuns

### "Invalid username or password"
- Verifique se o usuário existe na tabela Users
- Confirme que copiou a senha hasheada corretamente
- Gere uma nova senha com o script

### Items não aparecem
- Confirme que a tabela "Items" existe no Airtable
- Verifique que há registros na tabela
- Confira as variáveis de ambiente no Cloudflare Pages

### "Airtable not configured"
- Adicione as variáveis de ambiente no Cloudflare Pages
- Faça um novo deploy

## 💡 Próximos Passos Sugeridos

1. ✅ **Concluído**: Sistema de autenticação
2. ✅ **Concluído**: Gerenciamento de usuários
3. ✅ **Concluído**: Integração com Airtable
4. 🔜 **Sugestão**: Implementar JWT para autenticação server-side
5. 🔜 **Sugestão**: Adicionar upload de imagens
6. 🔜 **Sugestão**: Sistema de reservas completo

## 🎉 Pronto!

Seu sistema agora está protegido e funcionando com dados do Airtable!

Qualquer dúvida, consulte a documentação ou abra uma issue.
