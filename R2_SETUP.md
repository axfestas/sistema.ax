# Guia de Configuração do R2 Storage

Este guia mostra como configurar o Cloudflare R2 para armazenamento de imagens e arquivos no sistema.

## 📦 O que é R2?

O Cloudflare R2 Storage é um serviço de armazenamento de objetos compatível com S3, ideal para armazenar imagens, arquivos e outros dados estáticos.

## 🚀 Configuração Inicial

### 1. Criar Bucket R2

Você pode criar o bucket via CLI ou Dashboard:

#### Via CLI (wrangler)

```bash
# Criar bucket
wrangler r2 bucket create sistema-ax-festas

# Verificar se foi criado
wrangler r2 bucket list
```

#### Via Dashboard

1. Acesse o [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Vá para **R2** no menu lateral
3. Clique em **Create bucket**
4. Nome do bucket: `sistema-ax-festas`
5. Clique em **Create bucket**

### 2. Configurar Binding no wrangler.toml

O binding já está configurado em `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "STORAGE"
bucket_name = "sistema-ax-festas"
```

**Importante:** Se você criou o bucket com um nome diferente, atualize `bucket_name` no arquivo.

### 3. Deploy

Após criar o bucket, faça o deploy da aplicação:

```bash
npm run build
npm run pages:deploy
```

## 📤 Usando o Upload de Arquivos

### API de Upload

A aplicação inclui uma API de upload em `/api/upload` com os seguintes endpoints:

#### POST /api/upload - Upload de arquivo

**Autenticação:** Requer admin

**Request:**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('folder', 'portfolio'); // Opcional: 'portfolio', 'items', 'general'

const response = await fetch('/api/upload', {
  method: 'POST',
  headers: {
    'Cookie': 'session_id=...' // Cookie de sessão
  },
  body: formData
});

const result = await response.json();
console.log(result);
// {
//   success: true,
//   key: "portfolio/1234567890-imagem.jpg",
//   url: "/api/upload?key=portfolio%2F1234567890-imagem.jpg",
//   filename: "imagem.jpg",
//   size: 102400,
//   type: "image/jpeg"
// }
```

#### GET /api/upload?key=path/to/file - Obter arquivo

**Autenticação:** Não requer (público)

**Request:**
```javascript
const response = await fetch('/api/upload?key=portfolio/1234567890-imagem.jpg');
const blob = await response.blob();
const imageUrl = URL.createObjectURL(blob);
```

#### DELETE /api/upload?key=path/to/file - Deletar arquivo

**Autenticação:** Requer admin

**Request:**
```javascript
const response = await fetch('/api/upload?key=portfolio/1234567890-imagem.jpg', {
  method: 'DELETE',
  headers: {
    'Cookie': 'session_id=...'
  }
});

const result = await response.json();
console.log(result);
// {
//   success: true,
//   message: "File deleted successfully"
// }
```

## 🎨 Exemplo de Uso no Frontend

### Upload de Imagem no Admin

```typescript
// Exemplo de componente de upload
async function handleUpload(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'portfolio');

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();
    
    // Usar a URL retornada para criar registro no banco
    await fetch('/api/portfolio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Nova Imagem',
        description: 'Descrição',
        image_url: result.url, // URL do R2
      }),
    });

    console.log('Upload concluído:', result);
  } catch (error) {
    console.error('Erro no upload:', error);
  }
}
```

### Exibir Imagem do R2

```tsx
// Exemplo de componente de imagem
function PortfolioImage({ imageKey }: { imageKey: string }) {
  const imageUrl = `/api/upload?key=${encodeURIComponent(imageKey)}`;
  
  return (
    <img 
      src={imageUrl} 
      alt="Portfolio" 
      loading="lazy"
    />
  );
}
```

## 🔒 Segurança

### Validações Implementadas

1. **Autenticação:** Upload e delete requerem autenticação de admin
2. **Tipos de arquivo:** Apenas imagens são permitidas (JPEG, PNG, GIF, WEBP)
3. **Nomes únicos:** Cada arquivo recebe um timestamp único para evitar conflitos e cache busting
4. **Sanitização:** Nomes de arquivo são sanitizados removendo caracteres especiais e separando extensão

### Recomendações

- ✅ **Sempre valide** o tipo de arquivo no frontend antes do upload
- ✅ **Limite o tamanho** dos arquivos (ex: max 5MB)
- ✅ **Use pastas** para organizar diferentes tipos de conteúdo
- ✅ **Implemente rate limiting** se necessário
- ⚠️ **Nunca exponha** credenciais do R2 no frontend

## 📁 Estrutura de Pastas

O sistema organiza arquivos em pastas:

```
sistema-ax-festas/
├── portfolio/          # Imagens do portfólio
├── items/              # Imagens de itens do catálogo
├── general/            # Arquivos gerais (padrão)
└── ...
```

## 🧪 Testando

### Teste de Upload via cURL

```bash
# 1. Fazer login e obter cookie de sessão
curl -X POST http://localhost:8788/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"senha123"}' \
  -c cookies.txt

# 2. Upload de arquivo
curl -X POST http://localhost:8788/api/upload \
  -b cookies.txt \
  -F "file=@/path/to/image.jpg" \
  -F "folder=portfolio"

# 3. Acessar arquivo
curl http://localhost:8788/api/upload?key=portfolio/1234567890-image.jpg \
  --output downloaded-image.jpg
```

## 🔧 Troubleshooting

### Erro: "Storage not available"

- Verifique se o bucket R2 foi criado
- Confirme que o nome do bucket em `wrangler.toml` está correto
- Redeploy a aplicação após criar o bucket

### Erro: "Unauthorized"

- Verifique se está autenticado como admin
- Confira se o cookie de sessão está sendo enviado
- Tente fazer login novamente

### Erro: "Invalid file type"

- Apenas imagens são permitidas (JPEG, PNG, GIF, WEBP)
- Verifique o tipo MIME do arquivo
- Tente com um arquivo de imagem válido

## 📚 Recursos

- [Documentação Cloudflare R2](https://developers.cloudflare.com/r2/)
- [R2 API Reference](https://developers.cloudflare.com/r2/api/)
- [Wrangler R2 Commands](https://developers.cloudflare.com/workers/wrangler/commands/#r2)

## 🎯 Próximos Passos

1. ✅ Bucket R2 criado
2. ✅ Binding configurado em wrangler.toml
3. ✅ API de upload implementada
4. 📝 Implementar UI de upload no admin panel
5. 📝 Adicionar preview de imagens
6. 📝 Implementar progresso de upload
7. 📝 Adicionar compressão de imagens
