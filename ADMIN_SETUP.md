# 🔐 Como Criar o Primeiro Usuário Admin

Este guia explica como criar seu primeiro usuário administrador no sistema.

## 📋 Informações do Admin

- **Email:** alex.fraga@axfestas.com.br
- **Nome:** Alex Fraga
- **Role:** admin

---

## 🚀 Opção 1: Via SQL Direto (Mais Rápido)

Esta é a maneira mais rápida de criar o primeiro admin no banco D1.

### Passo 1: Gerar Hash da Senha

Execute este script Node.js para gerar o hash da sua senha:

```bash
node scripts/generate-password-hash.js "SUA_SENHA_AQUI"
```

Isso irá gerar algo como:
```
Salt: a1b2c3d4e5f6...
Hash: 9876543210abcdef...
Password Hash: a1b2c3d4e5f6...:9876543210abcdef...
```

### Passo 2: Executar SQL no D1

Com o password hash gerado, execute este SQL:

```sql
INSERT INTO users (email, password_hash, name, role)
VALUES (
  'alex.fraga@axfestas.com.br',
  'SEU_PASSWORD_HASH_AQUI',
  'Alex Fraga',
  'admin'
);
```

**Via Wrangler CLI:**

```bash
wrangler d1 execute sistema-ax-festas --command="INSERT INTO users (email, password_hash, name, role) VALUES ('alex.fraga@axfestas.com.br', 'SEU_PASSWORD_HASH_AQUI', 'Alex Fraga', 'admin');"
```

### Passo 3: Fazer Login

1. Acesse `/login`
2. Email: `alex.fraga@axfestas.com.br`
3. Senha: A senha que você definiu
4. Você será redirecionado para `/admin` como administrador!

---

## 🛠️ Opção 2: Via Script Automatizado

Use o script Node.js que faz tudo automaticamente.

### Passo 1: Executar o Script

```bash
node scripts/create-first-admin.js
```

O script irá:
1. Pedir sua senha
2. Gerar o hash automaticamente
3. Inserir o usuário admin no banco D1
4. Confirmar a criação

### Passo 2: Fazer Login

Acesse `/login` com:
- Email: `alex.fraga@axfestas.com.br`
- Senha: A que você definiu

---

## 🔐 Opção 3: Via Endpoint Especial (Mais Seguro)

Para ambientes de produção, é mais seguro usar um endpoint protegido.

### Como Funciona

1. Existe um endpoint especial: `/api/auth/create-first-admin`
2. Ele só funciona **UMA VEZ** (quando não há nenhum admin)
3. Requer uma chave secreta de ambiente

### Configurar

**1. Adicione a variável de ambiente no Cloudflare:**

```
FIRST_ADMIN_SECRET=SUA_CHAVE_SECRETA_COMPLEXA_AQUI
```

**2. Faça uma requisição POST:**

```bash
curl -X POST https://seu-site.pages.dev/api/auth/create-first-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alex.fraga@axfestas.com.br",
    "password": "SUA_SENHA_AQUI",
    "name": "Alex Fraga",
    "secret": "SUA_CHAVE_SECRETA_COMPLEXA_AQUI"
  }'
```

**3. Resposta de Sucesso:**

```json
{
  "message": "Primeiro admin criado com sucesso",
  "user": {
    "id": 1,
    "email": "alex.fraga@axfestas.com.br",
    "name": "Alex Fraga",
    "role": "admin"
  }
}
```

**4. Fazer Login:**

Acesse `/login` normalmente.

---

## ✅ Verificar se o Admin Foi Criado

### Via Wrangler CLI:

```bash
wrangler d1 execute sistema-ax-festas --command="SELECT id, email, name, role FROM users WHERE email = 'alex.fraga@axfestas.com.br';"
```

Deve retornar:

```
┌────┬──────────────────────────────┬─────────────┬───────┐
│ id │ email                        │ name        │ role  │
├────┼──────────────────────────────┼─────────────┼───────┤
│ 1  │ alex.fraga@axfestas.com.br   │ Alex Fraga  │ admin │
└────┴──────────────────────────────┴─────────────┴───────┘
```

### Via Login:

1. Acesse `/login`
2. Use email: `alex.fraga@axfestas.com.br`
3. Se conseguir fazer login e acessar `/admin`, está funcionando!

---

## 🔄 Criar Mais Administradores

Depois que o primeiro admin estiver criado, você pode criar novos usuários (incluindo admins) através da interface admin:

### Via Interface Admin (Futuro):

1. Faça login como admin
2. Vá para `/admin/users` (quando implementado)
3. Clique em "Criar Usuário"
4. Preencha os dados e selecione role "admin"

### Via API (Já Funciona):

Com o admin logado, use o endpoint `/api/auth/register`:

```bash
curl -X POST https://seu-site.pages.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Cookie: session_id=SEU_SESSION_ID" \
  -d '{
    "email": "outro@exemplo.com",
    "password": "senha123",
    "name": "Outro Admin"
  }'
```

**Nota:** O endpoint `/api/auth/register` já está protegido e só admin pode usar!

---

## 📝 Comandos Úteis

### Ver todos os usuários:

```bash
wrangler d1 execute sistema-ax-festas --command="SELECT id, email, name, role, created_at FROM users;"
```

### Deletar um usuário (cuidado!):

```bash
wrangler d1 execute sistema-ax-festas --command="DELETE FROM users WHERE email = 'email@exemplo.com';"
```

### Tornar usuário existente em admin:

```bash
wrangler d1 execute sistema-ax-festas --command="UPDATE users SET role = 'admin' WHERE email = 'email@exemplo.com';"
```

### Resetar senha de um usuário:

```bash
# Primeiro gere o hash com: node scripts/generate-password-hash.js "nova_senha"
wrangler d1 execute sistema-ax-festas --command="UPDATE users SET password_hash = 'NOVO_HASH_AQUI' WHERE email = 'email@exemplo.com';"
```

---

## ⚠️ Segurança

### Boas Práticas:

1. ✅ **Use senhas fortes** (mínimo 12 caracteres, letras, números, símbolos)
2. ✅ **Não compartilhe** a senha do admin
3. ✅ **Delete o endpoint** `/api/auth/create-first-admin` depois de usar (Opção 3)
4. ✅ **Não commite** senhas ou secrets no código
5. ✅ **Use variáveis de ambiente** para secrets

### Recuperar Acesso de Admin:

Se você perder a senha do admin:

```bash
# 1. Gere novo hash
node scripts/generate-password-hash.js "nova_senha_forte"

# 2. Atualize no banco
wrangler d1 execute sistema-ax-festas --command="UPDATE users SET password_hash = 'NOVO_HASH' WHERE email = 'alex.fraga@axfestas.com.br';"
```

---

## 🎯 Resumo Rápido

Para criar o primeiro admin **AGORA**:

```bash
# 1. Gere o hash da senha
node scripts/generate-password-hash.js "MinhaSenh@123"

# 2. Copie o "Password Hash" que aparecer

# 3. Execute no D1 (substitua HASH_COPIADO)
wrangler d1 execute sistema-ax-festas --command="INSERT INTO users (email, password_hash, name, role) VALUES ('alex.fraga@axfestas.com.br', 'HASH_COPIADO', 'Alex Fraga', 'admin');"

# 4. Faça login em /login
```

Pronto! 🎉

---

## 🆘 Problemas?

### Erro: "Email já cadastrado"

O usuário já existe. Para ver:

```bash
wrangler d1 execute sistema-ax-festas --command="SELECT * FROM users WHERE email = 'alex.fraga@axfestas.com.br';"
```

Para deletar e recriar:

```bash
wrangler d1 execute sistema-ax-festas --command="DELETE FROM users WHERE email = 'alex.fraga@axfestas.com.br';"
```

### Erro: "Cannot find database 'sistema-ax-festas'"

O banco D1 não foi criado. Crie com:

```bash
wrangler d1 create sistema-ax-festas
```

Depois execute o schema:

```bash
wrangler d1 execute sistema-ax-festas --file=./schema.sql
```

### Login não funciona

1. Verifique se o usuário existe no banco
2. Verifique se o role é 'admin'
3. Tente resetar a senha (veja seção Segurança acima)
4. Verifique os logs do navegador (F12) para erros

---

## 📚 Mais Informações

- [Documentação de Autenticação](./src/lib/auth.ts)
- [Schema do Banco](./schema.sql)
- [Guia de Deploy](./DEPLOY.md)
