# 🚀 Guia Rápido: Criar Admin alex.fraga@axfestas.com.br

## ✨ Método Mais Simples (2 passos)

### Passo 1: Gere o hash da sua senha

```bash
node scripts/generate-password-hash.js "SuaSenhaAqui"
```

Exemplo de saída:
```
✅ Hash gerado com sucesso!

📋 Use este Password Hash no SQL:

'abc123...:def456...'
```

### Passo 2: Crie o admin no banco D1

Copie o comando que apareceu acima, ou use este (substitua `HASH_COPIADO`):

```bash
wrangler d1 execute sistema-ax-festas --command="INSERT INTO users (email, password_hash, name, role) VALUES ('alex.fraga@axfestas.com.br', 'HASH_COPIADO', 'Alex Fraga', 'admin');"
```

### Pronto! ✅

Acesse `/login` com:
- **Email:** alex.fraga@axfestas.com.br  
- **Senha:** A senha que você usou no Passo 1

---

## 🎯 Alternativa: Script Automático

Se preferir, use o script que faz tudo automaticamente:

```bash
node scripts/create-first-admin.js
```

O script irá:
1. Pedir sua senha
2. Gerar o hash
3. Criar o admin no banco
4. Confirmar sucesso

---

## 📖 Documentação Completa

Para mais opções e detalhes, veja: **[ADMIN_SETUP.md](./ADMIN_SETUP.md)**

Lá você encontra:
- ✅ 3 métodos diferentes de criação
- ✅ Comandos para gerenciar usuários
- ✅ Troubleshooting
- ✅ Como recuperar senha
- ✅ Como criar mais admins

---

## ❓ Dúvidas Frequentes

### O banco D1 não existe ainda?

Crie com:
```bash
wrangler d1 create sistema-ax-festas
```

Depois execute o schema:
```bash
wrangler d1 execute sistema-ax-festas --file=./schema.sql
```

### Já existe um admin?

Veja quem é:
```bash
wrangler d1 execute sistema-ax-festas --command="SELECT email, name, role FROM users WHERE role = 'admin';"
```

Para deletar e recriar:
```bash
wrangler d1 execute sistema-ax-festas --command="DELETE FROM users WHERE email = 'alex.fraga@axfestas.com.br';"
```

### Esqueci a senha do admin?

Resete com:
```bash
# 1. Gere novo hash
node scripts/generate-password-hash.js "NovaSenha123"

# 2. Atualize no banco (substitua NOVO_HASH)
wrangler d1 execute sistema-ax-festas --command="UPDATE users SET password_hash = 'NOVO_HASH' WHERE email = 'alex.fraga@axfestas.com.br';"
```

---

## 💡 Resumão

1. **Gere hash:** `node scripts/generate-password-hash.js "senha"`
2. **Copie o hash** que aparecer
3. **Execute SQL:** Use o comando mostrado (ou o do passo 2 acima)
4. **Faça login:** Acesse `/login` com alex.fraga@axfestas.com.br

🎉 Simples assim!
