# 📝 Configurações do Site - Guia de Uso

## ✨ Novidade: Edição de Configurações pelo Admin

Agora você pode editar todas as informações do site diretamente pelo painel administrativo, sem precisar alterar código!

---

## 🎯 O Que Pode Ser Editado

### 1. **Informações da Empresa**
- Nome da empresa (exibido no header e footer)
- Descrição da empresa (exibida no footer)

### 2. **Informações de Contato**
- Telefone
- Email
- Endereço

### 3. **Redes Sociais**
- URL do Facebook
- URL do Instagram
- URL do WhatsApp

---

## 🚀 Como Usar

### Passo 1: Acessar as Configurações

1. Faça login no sistema como **administrador**
2. No painel admin (`/admin`), clique no card **"⚙️ Configurações"**
3. Ou acesse diretamente: `/admin/settings`

### Passo 2: Editar as Informações

**Informações da Empresa:**
```
Nome da Empresa: Ax Festas
Descrição: Aluguel de itens para festas e eventos. Qualidade e excelência no atendimento.
```

**Informações de Contato:**
```
Telefone: (99) 99999-9999
Email: contato@axfestas.com.br
Endereço: Rua Example, 123 - Cidade/UF
```

**Redes Sociais:**
```
Facebook: https://facebook.com/axfestas
Instagram: https://instagram.com/axfestas
WhatsApp: https://wa.me/5599999999999
```

### Passo 3: Salvar

1. Preencha os campos desejados
2. Clique em **"Salvar Configurações"**
3. Aguarde a mensagem de sucesso
4. As mudanças são **imediatas** em todo o site!

---

## 💡 Dicas e Observações

### ✅ Campos Obrigatórios
Os seguintes campos **não podem** ficar vazios:
- Nome da Empresa
- Descrição da Empresa
- Telefone
- Email
- Endereço

### 🔗 URLs das Redes Sociais (Opcional)
- Se você **não preencher** uma URL de rede social, o ícone **não aparecerá** no rodapé
- Formato WhatsApp: `https://wa.me/5599999999999` (código do país + DDD + número, sem espaços)
- Formato Facebook: `https://facebook.com/nomedapagina`
- Formato Instagram: `https://instagram.com/nomedaperfil`

### 📍 Onde as Informações Aparecem

| Campo | Onde Aparece |
|-------|-------------|
| Nome da Empresa | Header (topo) + Footer (rodapé) |
| Descrição | Footer (rodapé) |
| Telefone | Footer (rodapé) |
| Email | Footer (rodapé) |
| Endereço | Footer (rodapé) |
| Redes Sociais | Footer (rodapé) - apenas se URLs estiverem configuradas |

---

## 🔐 Segurança

- ✅ **Apenas administradores** podem editar as configurações
- ✅ Tentativas de acesso não autorizadas retornam erro 403
- ✅ Todas as alterações são validadas antes de serem salvas
- ✅ O sistema possui tratamento de erros completo

---

## 🛠️ Aspectos Técnicos

### Banco de Dados
- Tabela: `site_settings`
- Apenas **1 registro** é mantido (id = 1)
- Atualizado via API PUT `/api/settings`

### API Endpoints

**GET /api/settings**
- Retorna as configurações atuais
- Público (não requer autenticação)

**PUT /api/settings**
- Atualiza as configurações
- Requer autenticação de admin
- Aceita objeto JSON com os campos a atualizar

### Exemplo de Requisição (API)

```bash
curl -X PUT https://seu-site.pages.dev/api/settings \
  -H "Content-Type: application/json" \
  -H "Cookie: session_id=SEU_SESSION_ID" \
  -d '{
    "company_name": "Ax Festas",
    "phone": "(99) 99999-9999",
    "email": "contato@axfestas.com.br"
  }'
```

---

## 📊 Estrutura dos Dados

### SiteSettings Interface

```typescript
interface SiteSettings {
  id: number;
  company_name: string;
  company_description: string;
  phone: string;
  email: string;
  address: string;
  facebook_url?: string;
  instagram_url?: string;
  whatsapp_url?: string;
  updated_at?: string;
}
```

---

## 🔄 Migração de Dados

### Primeira Vez (Setup Inicial)

Quando você executar o schema pela primeira vez, as configurações padrão serão criadas automaticamente:

```sql
INSERT OR IGNORE INTO site_settings (id, company_name, company_description, phone, email, address) 
VALUES (
  1, 
  'Ax Festas', 
  'Aluguel de itens para festas e eventos. Qualidade e excelência no atendimento.', 
  '(00) 00000-0000', 
  'contato@axfestas.com.br', 
  'A definir'
);
```

### Atualizar Banco Existente

Se você já tem um banco D1 rodando, execute esta atualização:

```bash
# Via wrangler
wrangler d1 execute sistema --file=schema.sql

# Ou manualmente via SQL
wrangler d1 execute sistema --command="
CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  company_name TEXT NOT NULL DEFAULT 'Ax Festas',
  company_description TEXT DEFAULT 'Aluguel de itens para festas e eventos.',
  phone TEXT DEFAULT '(00) 00000-0000',
  email TEXT DEFAULT 'contato@axfestas.com.br',
  address TEXT DEFAULT 'A definir',
  facebook_url TEXT,
  instagram_url TEXT,
  whatsapp_url TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO site_settings (id) VALUES (1);
"
```

---

## 🎨 Interface do Admin

A página de configurações está organizada em **3 seções**:

1. **Informações da Empresa**
   - Nome da Empresa
   - Descrição da Empresa

2. **Informações de Contato**
   - Telefone
   - Email
   - Endereço

3. **Redes Sociais**
   - Facebook URL
   - Instagram URL
   - WhatsApp URL

Cada seção tem um título destacado e campos claramente identificados.

---

## ✨ Funcionalidades

- ✅ **Edição em tempo real**: Mudanças aparecem imediatamente
- ✅ **Validação de formulário**: Campos obrigatórios são verificados
- ✅ **Feedback visual**: Mensagens de sucesso/erro
- ✅ **Layout responsivo**: Funciona em desktop e mobile
- ✅ **Proteção de rotas**: Apenas admins podem acessar
- ✅ **Fallback inteligente**: Se a API falhar, usa valores padrão

---

## 📝 Changelog

### Versão 1.0 (2026-02-11)
- ✅ Criada tabela `site_settings`
- ✅ Implementada API GET/PUT `/api/settings`
- ✅ Criada página admin `/admin/settings`
- ✅ Atualizado Footer para buscar dados da API
- ✅ Atualizado Header para buscar nome da empresa
- ✅ Adicionado card de Configurações no dashboard admin

---

## 🆘 Troubleshooting

### Configurações não aparecem
1. Verifique se a tabela `site_settings` foi criada no banco D1
2. Verifique se há um registro com `id = 1` na tabela
3. Teste a API: `curl https://seu-site.pages.dev/api/settings`

### Não consigo salvar alterações
1. Verifique se você está logado como **admin**
2. Verifique os logs do Cloudflare Pages
3. Certifique-se de que o banco D1 está acessível

### Ícones das redes sociais não aparecem
1. Verifique se as URLs foram preenchidas corretamente
2. As URLs devem começar com `https://`
3. Os ícones só aparecem se as URLs estiverem configuradas

---

## 🎉 Conclusão

Agora você tem controle total sobre as informações do site através de uma interface amigável!

Não é mais necessário editar código ou fazer deploy para mudar informações básicas como telefone, email ou endereço.

**Enjoy! 🚀**

---

**Data de Criação:** 2026-02-11  
**Autor:** Sistema Ax Festas  
**Versão:** 1.0
