# Configuração de Autenticação - Sistema AX

Este documento explica como configurar o sistema de autenticação e criar a conta de administrador.

## 1. Criar Tabela de Usuários no Airtable

Primeiro, você precisa criar uma nova tabela chamada **"Users"** no seu Airtable Base.

### Campos da Tabela Users:

| Nome do Campo | Tipo | Descrição |
|--------------|------|-----------|
| username | Single line text | Nome de usuário (único) |
| password | Single line text | Senha hasheada (bcrypt) |
| role | Single select | Opções: "admin", "user" |
| name | Single line text | Nome completo (opcional) |
| email | Email | Email do usuário (opcional) |
| createdAt | Date | Data de criação (opcional) |

## 2. Criar Conta de Administrador

Para criar a primeira conta de administrador, você precisará executar um script Node.js localmente.

### Passo 1: Instalar dependências

```bash
npm install
```

### Passo 2: Criar arquivo .env.local

Crie um arquivo `.env.local` na raiz do projeto com suas credenciais do Airtable:

```env
AIRTABLE_API_KEY=seu_api_key_aqui
AIRTABLE_BASE_ID=seu_base_id_aqui
AIRTABLE_USERS_TABLE=Users
```

### Passo 3: Executar o script de criação de admin

Crie e execute o seguinte script para gerar sua senha de admin:

**Arquivo: `scripts/create-admin.js`**

```javascript
const bcrypt = require('bcryptjs');

async function generatePassword() {
  // Altere a senha aqui
  const password = 'SuaSenhaSeguraAqui123!';
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  console.log('\n=== CREDENCIAIS DE ADMIN ===');
  console.log('Username: admin');
  console.log('Password (original):', password);
  console.log('\n=== SENHA HASHEADA (Cole no Airtable) ===');
  console.log(hashedPassword);
  console.log('\n');
}

generatePassword();
```

Execute:

```bash
node scripts/create-admin.js
```

### Passo 4: Adicionar admin no Airtable

1. Abra sua tabela "Users" no Airtable
2. Clique em "Add record" (adicionar registro)
3. Preencha os campos:
   - **username**: `admin`
   - **password**: Cole a senha hasheada gerada pelo script
   - **role**: Selecione `admin`
   - **name**: (opcional) Ex: "Administrador"
   - **email**: (opcional) Seu email

## 3. Configurar Variáveis de Ambiente no Cloudflare Pages

No Cloudflare Pages Dashboard:

1. Vá para seu projeto
2. Clique em **Settings** > **Environment variables**
3. Adicione as seguintes variáveis:

```
AIRTABLE_API_KEY = seu_api_key_aqui
AIRTABLE_BASE_ID = seu_base_id_aqui
AIRTABLE_USERS_TABLE = Users
AIRTABLE_ITEMS_TABLE = Items
AIRTABLE_RESERVATIONS_TABLE = Reservations
AIRTABLE_MAINTENANCE_TABLE = Maintenance
AIRTABLE_FINANCE_TABLE = Finance
```

4. Clique em **Save**
5. Faça um novo deploy do projeto

## 4. Fazer Login

Após o deploy:

1. Acesse seu site
2. Vá para `/login`
3. Entre com:
   - **Usuário**: `admin`
   - **Senha**: A senha que você definiu no script

## 5. Adicionar Mais Usuários

Após fazer login como admin:

1. Clique em **"Usuários"** no menu do admin
2. Clique em **"Adicionar Usuário"**
3. Preencha o formulário:
   - **Usuário**: Nome de usuário único
   - **Senha**: Senha do novo usuário
   - **Função**: Admin ou Usuário
   - **Nome**: Nome completo (opcional)
   - **Email**: Email (opcional)
4. Clique em **"Adicionar"**

## 6. Segurança

⚠️ **Importante:**

- A senha é armazenada de forma hasheada (criptografada) no Airtable
- Use senhas fortes e únicas
- Nunca compartilhe suas credenciais
- O sistema usa bcrypt para hash de senhas
- A autenticação é baseada em localStorage (client-side)
- Para produção, considere implementar JWT ou sessions mais seguras

## Exemplo Rápido: Criar Hash de Senha

Se você só quer gerar um hash rapidamente:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('MinhaSenh@123', 10).then(h => console.log(h));"
```

Isso imprimirá o hash da senha que você pode usar diretamente no Airtable.

## Problemas Comuns

### "Airtable not configured"
- Verifique se as variáveis de ambiente estão configuradas no Cloudflare Pages
- Faça um novo deploy após adicionar as variáveis

### "Invalid username or password"
- Verifique se o usuário existe na tabela Users do Airtable
- Confirme que a senha hasheada foi copiada corretamente
- Tente gerar uma nova senha hasheada

### Items não aparecem
- Verifique se a tabela Items existe no Airtable
- Confirme que há registros na tabela
- Verifique as variáveis de ambiente no Cloudflare Pages

## Suporte

Se você tiver problemas, verifique:

1. Console do navegador para erros
2. Logs do Cloudflare Pages
3. Que todas as variáveis de ambiente estão configuradas
4. Que as tabelas existem no Airtable com os nomes corretos
