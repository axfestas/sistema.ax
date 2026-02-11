# 🔐 Guia: Como Configurar Seu Admin com Sua Senha

Você forneceu:
- **Chave Secreta (FIRST_ADMIN_SECRET):** `y+!4x8$V?Z9z!@mNpR#T&WkYq2u5v8y/A?D(G+KbPeShVmYq3t6w9z$C&E)H@McQ`
- **Senha do Admin:** `Ax7866Nb@`

Este guia mostra como usar essas informações para criar sua conta de administrador.

---

## 🎯 Método Recomendado: Via API (Mais Fácil)

Este método usa o endpoint especial `/api/auth/create-first-admin` que já existe no sistema.

### Passo 1: Configure a Variável de Ambiente no Cloudflare Pages

1. Acesse o [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Vá em **Pages** → Seu projeto **sistema-ax-festas**
3. Clique em **Settings** → **Environment variables**
4. Adicione uma nova variável:
   - **Nome:** `FIRST_ADMIN_SECRET`
   - **Valor:** `y+!4x8$V?Z9z!@mNpR#T&WkYq2u5v8y/A?D(G+KbPeShVmYq3t6w9z$C&E)H@McQ`
   - **Ambiente:** Production (e Development se quiser testar localmente)
5. Clique em **Save**
6. **Importante:** Faça um novo deploy para aplicar a variável:
   - Vá em **Deployments**
   - Clique em **Retry deployment** no último deploy

⏳ Aguarde alguns minutos até o deploy completar.

### Passo 2: Chame a API para Criar o Admin

Agora que a variável está configurada, você pode criar o admin de duas formas:

#### Opção A: Usando o Script Node.js (Recomendado)

No seu terminal, dentro da pasta do projeto:

```bash
node scripts/setup-admin-with-api.js
```

O script vai pedir:
- **URL do site:** Digite a URL do seu site (ex: `https://sistema-ax.pages.dev`)
- **Chave secreta:** Cole: `y+!4x8$V?Z9z!@mNpR#T&WkYq2u5v8y/A?D(G+KbPeShVmYq3t6w9z$C&E)H@McQ`
- **Senha:** Digite: `Ax7866Nb@`
- **Email:** Pressione Enter (usa `alex.fraga@axfestas.com.br` por padrão)
- **Nome:** Pressione Enter (usa `Alex Fraga` por padrão)

Ou passe tudo de uma vez:

```bash
node scripts/setup-admin-with-api.js \
  "https://SEU-SITE.pages.dev" \
  "y+!4x8$V?Z9z!@mNpR#T&WkYq2u5v8y/A?D(G+KbPeShVmYq3t6w9z$C&E)H@McQ" \
  "Ax7866Nb@"
```

#### Opção B: Usando cURL (Alternativa)

```bash
curl -X POST https://SEU-SITE.pages.dev/api/auth/create-first-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alex.fraga@axfestas.com.br",
    "password": "Ax7866Nb@",
    "name": "Alex Fraga",
    "secret": "y+!4x8$V?Z9z!@mNpR#T&WkYq2u5v8y/A?D(G+KbPeShVmYq3t6w9z$C&E)H@McQ"
  }'
```

**Substitua** `SEU-SITE.pages.dev` pela URL real do seu site no Cloudflare Pages.

### Passo 3: Faça Login

Se deu tudo certo, você verá uma mensagem de sucesso! Agora:

1. Acesse: `https://SEU-SITE.pages.dev/login`
2. Digite:
   - **Email:** `alex.fraga@axfestas.com.br`
   - **Senha:** `Ax7866Nb@`
3. Clique em **Entrar**
4. ✅ Você será redirecionado para `/admin` como administrador!

---

## 🔧 Método Alternativo: Via SQL Direto

Se preferir criar o admin diretamente no banco de dados:

### Passo 1: Gere o Hash da Senha

```bash
node scripts/generate-password-hash.js "Ax7866Nb@"
```

Isso vai gerar um hash. Copie o valor que aparecer em **Password Hash**.

### Passo 2: Insira no Banco D1

```bash
wrangler d1 execute sistema-ax-festas --command="INSERT INTO users (email, password_hash, name, role) VALUES ('alex.fraga@axfestas.com.br', 'COLE_O_HASH_AQUI', 'Alex Fraga', 'admin');"
```

Substitua `COLE_O_HASH_AQUI` pelo hash gerado no passo anterior.

### Passo 3: Faça Login

Acesse `/login` com:
- **Email:** `alex.fraga@axfestas.com.br`
- **Senha:** `Ax7866Nb@`

---

## ❓ Problemas Comuns

### Erro: "Invalid secret key"

✅ **Solução:** 
- Verifique se você configurou `FIRST_ADMIN_SECRET` no Cloudflare Pages
- Verifique se fez um novo deploy após adicionar a variável
- Certifique-se de que copiou a chave exatamente como está (sem espaços extras)

### Erro: "Admin user already exists"

✅ **Solução:**
Já existe um admin! Para verificar quem é:

```bash
wrangler d1 execute sistema-ax-festas --command="SELECT email, name, role FROM users WHERE role = 'admin';"
```

Se quiser resetar a senha do admin existente:

```bash
# 1. Gere novo hash
node scripts/generate-password-hash.js "Ax7866Nb@"

# 2. Atualize (substitua NOVO_HASH pelo hash gerado)
wrangler d1 execute sistema-ax-festas --command="UPDATE users SET password_hash = 'NOVO_HASH' WHERE email = 'alex.fraga@axfestas.com.br';"
```

### Erro: "Cannot find database"

✅ **Solução:**
O banco D1 precisa ser criado primeiro:

```bash
# 1. Criar banco
wrangler d1 create sistema-ax-festas

# 2. Executar schema
wrangler d1 execute sistema-ax-festas --file=./schema.sql
```

### Login não funciona

✅ **Verificações:**

1. Verifique se o usuário existe:
```bash
wrangler d1 execute sistema-ax-festas --command="SELECT * FROM users WHERE email = 'alex.fraga@axfestas.com.br';"
```

2. Verifique se o role é 'admin':
```bash
wrangler d1 execute sistema-ax-festas --command="SELECT email, role FROM users WHERE email = 'alex.fraga@axfestas.com.br';"
```

3. Se necessário, resetar senha (veja acima)

---

## 🔒 Segurança

### Após Criar o Admin

1. ✅ **DELETE o endpoint** `/api/auth/create-first-admin`:
   - Remova o arquivo: `functions/api/auth/create-first-admin.ts`
   - Ou desabilite-o alterando a lógica para sempre retornar erro

2. ✅ **Remova a variável de ambiente** `FIRST_ADMIN_SECRET`:
   - Acesse Cloudflare Pages → Settings → Environment variables
   - Delete a variável `FIRST_ADMIN_SECRET`

3. ✅ **Não compartilhe** sua senha ou chave secreta

### Alterar Senha no Futuro

Se quiser trocar sua senha depois:

```bash
# 1. Gere hash da nova senha
node scripts/generate-password-hash.js "SuaNovaSenha"

# 2. Atualize no banco
wrangler d1 execute sistema-ax-festas --command="UPDATE users SET password_hash = 'NOVO_HASH' WHERE email = 'alex.fraga@axfestas.com.br';"
```

---

## 📞 Precisa de Ajuda?

Se ainda tiver problemas:

1. Verifique os logs do Cloudflare Pages (Dashboard → Seu projeto → Functions → Logs)
2. Consulte a documentação completa em [ADMIN_SETUP.md](./ADMIN_SETUP.md)
3. Tente o método alternativo (SQL direto) se a API não funcionar

---

## ✅ Checklist Rápido

- [ ] Configurei `FIRST_ADMIN_SECRET` no Cloudflare Pages
- [ ] Fiz um novo deploy após adicionar a variável
- [ ] Executei o script `setup-admin-with-api.js` OU usei cURL
- [ ] Recebi mensagem de sucesso da API
- [ ] Consegui fazer login em `/login`
- [ ] Fui redirecionado para `/admin`
- [ ] (Opcional) Removi o endpoint create-first-admin
- [ ] (Opcional) Removi a variável FIRST_ADMIN_SECRET do ambiente

🎉 **Pronto! Seu admin está configurado!**
