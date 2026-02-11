# 🚨 CORREÇÃO URGENTE: Erro de Deploy do R2

## ❌ Problema Atual

O deploy está falhando com o seguinte erro:

```
Error: Failed to publish your Function. Got error: Unknown internal error occurred.
```

Isso ocorre porque **o bucket R2 não foi criado antes do deploy**.

## ✅ Solução Imediata

### Passo 1: Criar o Bucket R2

**CRÍTICO:** Você DEVE criar o bucket R2 ANTES de fazer o deploy!

#### Via Wrangler CLI (Recomendado)

```bash
wrangler r2 bucket create sistema-ax-festas
```

#### Via Cloudflare Dashboard

1. Acesse [Cloudflare Dashboard](https://dash.cloudflare.com)
2. No menu lateral, clique em **R2**
3. Clique em **Create bucket**
4. Nome do bucket: `sistema-ax-festas` (exatamente como está no wrangler.toml)
5. Clique em **Create bucket**

### Passo 2: Configurar Domínio Público (Opcional)

Se você tem um domínio público R2, você pode configurá-lo:

**URL Pública:** https://pub-06abc983735843e4af93fcafedfeacde.r2.dev

Para configurar acesso público:

1. No Cloudflare Dashboard, vá para **R2**
2. Clique no bucket `sistema-ax-festas`
3. Vá para a aba **Settings**
4. Em **Public Access**, clique em **Allow Access**
5. O domínio público será gerado automaticamente

### Passo 3: Verificar que o Bucket Foi Criado

```bash
wrangler r2 bucket list
```

Você deve ver `sistema-ax-festas` na lista.

### Passo 4: Fazer Deploy Novamente

Agora que o bucket existe, o deploy funcionará:

```bash
# Via Cloudflare Pages (automático via Git push)
git push

# Ou via Wrangler CLI
npm run build
wrangler pages deploy out
```

## 🔍 Detalhes Técnicos

### Por que isso acontece?

O arquivo `wrangler.toml` referencia um bucket R2:

```toml
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "sistema-ax-festas"
```

Quando você faz deploy das Pages Functions, o Cloudflare tenta criar o binding para este bucket. Se o bucket não existe, o deploy falha com "Unknown internal error".

### Ordem Correta de Deploy

1. ✅ Criar banco D1 (`sistema`)
2. ✅ Inicializar banco com schema
3. ✅ **Criar bucket R2** (`sistema-ax-festas`) ← VOCÊ ESTÁ AQUI
4. ✅ Fazer deploy da aplicação

## 📋 Comandos Completos (Primeira Vez)

```bash
# 1. Criar banco D1 (se ainda não criou)
wrangler d1 create sistema

# 2. Inicializar banco
npm run db:init

# 3. CRIAR BUCKET R2 (OBRIGATÓRIO!)
wrangler r2 bucket create sistema-ax-festas

# 4. Verificar
wrangler r2 bucket list

# 5. Deploy
git push
# Ou
npm run build && wrangler pages deploy out
```

## ⚠️ Importante

- O nome do bucket DEVE ser exatamente `sistema-ax-festas`
- Se você mudar o nome, atualize o `wrangler.toml`
- O bucket precisa existir ANTES do deploy
- Você só precisa criar o bucket UMA VEZ

## 🆘 Ainda com Erro?

Se ainda tiver problemas:

1. Verifique se está autenticado: `wrangler whoami`
2. Faça login se necessário: `wrangler login`
3. Liste buckets para confirmar: `wrangler r2 bucket list`
4. Verifique o nome exato do bucket no wrangler.toml

## 📚 Referências

- [R2_SETUP.md](./R2_SETUP.md) - Guia completo de configuração do R2
- [DEPLOY.md](./DEPLOY.md) - Guia de deploy completo
- [Documentação Cloudflare R2](https://developers.cloudflare.com/r2/)
