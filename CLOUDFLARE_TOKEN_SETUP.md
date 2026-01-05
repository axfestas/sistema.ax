# 🔑 Guia Rápido: Configuração do API Token Cloudflare

> **Problema**: Erro `Authentication error [code: 10000]` ao usar `wrangler pages deploy`

## 🎯 Solução Rápida (5 minutos)

### 1️⃣ Criar o Token (2 min)

1. **Acesse**: [https://dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Clique em **"Create Token"**
3. Role para baixo e clique em **"Create Custom Token"**

### 2️⃣ Configurar Permissões (1 min)

**Token name**: `Wrangler Pages Deploy` (ou qualquer nome descritivo)

**Permissions**:
```
Account → Cloudflare Pages → Edit
```

**Account Resources**:
```
Include → Specific account → Ax Festas
```

**Client IP Address Filtering** (opcional):
```
deixe em branco (sem restrição)
```

**TTL** (Time to Live):
```
deixe em branco (sem expiração) ou defina um prazo
```

### 3️⃣ Criar e Copiar (30 seg)

1. Clique em **"Continue to summary"**
2. Revise e clique em **"Create Token"**
3. **COPIE O TOKEN** (você não poderá vê-lo novamente!)

### 4️⃣ Configurar no Terminal (1 min)

**Linux/Mac:**
```bash
export CLOUDFLARE_API_TOKEN="seu-token-copiado-aqui"
export CLOUDFLARE_ACCOUNT_ID="a39b043a2df362f77fc72e76b286e00c"
```

**Windows (PowerShell):**
```powershell
$env:CLOUDFLARE_API_TOKEN="seu-token-copiado-aqui"
$env:CLOUDFLARE_ACCOUNT_ID="a39b043a2df362f77fc72e76b286e00c"
```

**Windows (CMD):**
```cmd
set CLOUDFLARE_API_TOKEN=seu-token-copiado-aqui
set CLOUDFLARE_ACCOUNT_ID=a39b043a2df362f77fc72e76b286e00c
```

### 5️⃣ Testar (30 seg)

```bash
# Verificar autenticação
wrangler whoami

# Deve mostrar:
# ✔ You are logged in with an API Token
# └ Permissions: Cloudflare Pages - Edit
```

Se aparecer "Cloudflare Pages - Edit", está correto! ✅

### 6️⃣ Deploy

```bash
npm run build
wrangler pages deploy out --project-name=sistema-ax-festas
```

## 🔒 Para Tornar Permanente

### Linux/Mac (bash/zsh)

Adicione ao `~/.bashrc` ou `~/.zshrc`:

```bash
echo 'export CLOUDFLARE_API_TOKEN="seu-token-aqui"' >> ~/.bashrc
echo 'export CLOUDFLARE_ACCOUNT_ID="a39b043a2df362f77fc72e76b286e00c"' >> ~/.bashrc
source ~/.bashrc
```

### Windows

Adicione às variáveis de ambiente do sistema:
1. Pesquise "variáveis de ambiente" no menu Iniciar
2. Clique em "Editar as variáveis de ambiente do sistema"
3. Clique em "Variáveis de Ambiente"
4. Em "Variáveis do usuário", clique em "Novo"
5. Adicione `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`

## 🤖 Para GitHub Actions (CI/CD)

### 1. Adicionar Secrets no GitHub

1. Vá para: `https://github.com/axfestas/sistema.ax/settings/secrets/actions`
2. Clique em **"New repository secret"**
3. Adicione:
   - Nome: `CLOUDFLARE_API_TOKEN`
   - Valor: (seu token)
4. Adicione outro:
   - Nome: `CLOUDFLARE_ACCOUNT_ID`
   - Valor: `a39b043a2df362f77fc72e76b286e00c`

### 2. Usar no Workflow

```yaml
- name: Deploy to Cloudflare Pages
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    command: pages deploy out --project-name=sistema-ax-festas
```

## ❌ Erros Comuns

### "Authentication error [code: 10000]"
- ✅ Token não tem permissão "Cloudflare Pages - Edit"
- 🔧 Crie um novo token com a permissão correta

### "wrangler: command not found"
- ✅ Wrangler não está instalado
- 🔧 `npm install -g wrangler`

### "Project not found"
- ✅ Projeto não existe na conta
- 🔧 Crie o projeto primeiro via Dashboard ou use `--project-name`

### Token expirado
- ✅ Token passou do TTL (Time to Live)
- 🔧 Crie um novo token

## 📚 Mais Informações

Para instruções completas, veja [DEPLOY.md](./DEPLOY.md)

## 🆘 Precisa de Ajuda?

1. Verifique: `wrangler whoami` mostra a permissão correta?
2. Verifique: As variáveis de ambiente estão definidas? `echo $CLOUDFLARE_API_TOKEN`
3. Verifique: O projeto existe? Acesse https://dash.cloudflare.com e vá em "Workers & Pages"

Se o problema persistir, abra uma issue no repositório com os logs do erro (remova informações sensíveis!).
