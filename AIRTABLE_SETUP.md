# Configuração do Airtable

Este guia explica como configurar e usar a integração com Airtable no Sistema Ax Festas.

## 📋 Pré-requisitos

1. Conta no Airtable (gratuita ou paga)
2. Base criada no Airtable com as tabelas necessárias
3. API Key do Airtable

## 🔑 Obter API Key

1. Acesse sua conta no Airtable
2. Clique no seu avatar no canto superior direito
3. Selecione **Account**
4. Na seção **API**, clique em **Generate API key**
5. Copie a API key gerada (começa com `key...`)

## 🗄️ Estrutura das Tabelas no Airtable

### 1. Tabela: Items (Itens)

Campos recomendados:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| name | Single line text | Nome do item (obrigatório) |
| description | Long text | Descrição do item |
| category | Single select | Categoria (ex: Decoração, Mobília, Utensílios) |
| price | Currency | Preço de aluguel |
| quantity | Number | Quantidade disponível |
| status | Single select | Status (available, reserved, maintenance) |
| imageUrl | URL | Link para imagem do item |

### 2. Tabela: Reservations (Reservas)

Campos recomendados:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| customerName | Single line text | Nome do cliente |
| customerEmail | Email | Email do cliente |
| customerPhone | Phone | Telefone do cliente |
| eventDate | Date | Data do evento |
| returnDate | Date | Data de devolução |
| items | Multiple record links | Link para itens reservados (link para tabela Items) |
| totalValue | Currency | Valor total da reserva |
| status | Single select | Status (pending, confirmed, completed, cancelled) |
| notes | Long text | Observações |

### 3. Tabela: Maintenance (Manutenção)

Campos recomendados:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| itemId | Single line text | ID do item |
| itemName | Single line text | Nome do item |
| issueDescription | Long text | Descrição do problema |
| startDate | Date | Data de início |
| completionDate | Date | Data de conclusão |
| status | Single select | Status (pending, in_progress, completed) |
| cost | Currency | Custo da manutenção |
| technician | Single line text | Nome do técnico |
| notes | Long text | Observações |

### 4. Tabela: Finance (Finanças)

Campos recomendados:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| type | Single select | Tipo (income, expense) |
| category | Single select | Categoria (ex: Aluguel, Manutenção, Compra) |
| description | Long text | Descrição |
| amount | Currency | Valor |
| date | Date | Data da transação |
| paymentMethod | Single select | Método de pagamento |
| relatedReservation | Single line text | ID da reserva relacionada |
| notes | Long text | Observações |

## ⚙️ Configuração Local

1. Copie o arquivo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

2. Edite `.env.local` e adicione suas credenciais:

```env
AIRTABLE_API_KEY=keyXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_ITEMS_TABLE=Items
AIRTABLE_RESERVATIONS_TABLE=Reservations
AIRTABLE_MAINTENANCE_TABLE=Maintenance
AIRTABLE_FINANCE_TABLE=Finance
```

### Como encontrar o Base ID:

1. Abra sua base no Airtable
2. Vá em **Help** > **API Documentation**
3. O Base ID aparecerá na URL e na documentação (começa com `app...`)

## 🚀 Uso

### Importar funções

```typescript
import {
  getItems,
  createItem,
  getReservations,
  createReservation,
  getMaintenance,
  getFinance,
} from '@/lib/airtable';
```

### Exemplos de uso

#### Buscar todos os itens

```typescript
const items = await getItems();
console.log(items);

// Com filtros
const availableItems = await getItems({
  filterByFormula: "{status} = 'available'",
  maxRecords: 10
});
```

#### Criar novo item

```typescript
const newItem = await createItem({
  name: 'Mesa Redonda',
  description: 'Mesa redonda para 8 pessoas',
  category: 'Mobília',
  price: 50.00,
  quantity: 10,
  status: 'available'
});
```

#### Buscar reservas

```typescript
const reservations = await getReservations({
  filterByFormula: "{status} = 'confirmed'",
  view: 'Grid view'
});
```

#### Criar reserva

```typescript
const reservation = await createReservation({
  customerName: 'João Silva',
  customerEmail: 'joao@example.com',
  customerPhone: '11999999999',
  eventDate: '2026-03-15',
  returnDate: '2026-03-16',
  totalValue: 500.00,
  status: 'pending'
});
```

#### Resumo financeiro

```typescript
const summary = await getFinanceSummary('2026-01-01', '2026-12-31');
console.log(`Receita: R$ ${summary.totalIncome}`);
console.log(`Despesas: R$ ${summary.totalExpense}`);
console.log(`Saldo: R$ ${summary.balance}`);
```

## 🌐 Deploy no Cloudflare Pages

Para usar o Airtable em produção no Cloudflare Pages:

1. No Cloudflare Dashboard, vá para sua aplicação Pages
2. Acesse **Settings** > **Environment variables**
3. Adicione as variáveis de ambiente:
   - `AIRTABLE_API_KEY`
   - `AIRTABLE_BASE_ID`
   - `AIRTABLE_ITEMS_TABLE`
   - `AIRTABLE_RESERVATIONS_TABLE`
   - `AIRTABLE_MAINTENANCE_TABLE`
   - `AIRTABLE_FINANCE_TABLE`

**Importante**: Como o Next.js está configurado para static export, você precisará criar **Cloudflare Pages Functions** (API routes) para fazer as chamadas ao Airtable do lado do servidor.

## 📝 Exemplo de Pages Function

Crie um arquivo `/functions/api/items.ts`:

```typescript
import { getItems } from '../../src/lib/airtable';

export async function onRequest(context: any) {
  try {
    const items = await getItems();
    
    return new Response(JSON.stringify(items), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
```

Então, no cliente (páginas Next.js), faça:

```typescript
const response = await fetch('/api/items');
const items = await response.json();
```

## 🔒 Segurança

- ✅ Nunca commite o arquivo `.env.local` no Git
- ✅ Use variáveis de ambiente para credenciais
- ✅ O `.env.local` já está no `.gitignore`
- ✅ Mantenha sua API Key em segredo
- ✅ Use Cloudflare Pages Functions para chamadas server-side

## 📚 Recursos Adicionais

- [Documentação oficial do Airtable API](https://airtable.com/developers/web/api/introduction)
- [Airtable JavaScript SDK](https://github.com/Airtable/airtable.js)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)

## 🆘 Problemas Comuns

### Erro: "Airtable credentials not configured"

- Verifique se o arquivo `.env.local` existe e contém as variáveis corretas
- Reinicie o servidor de desenvolvimento após criar/modificar `.env.local`

### Erro: "NOT_FOUND"

- Verifique se o `AIRTABLE_BASE_ID` está correto
- Verifique se os nomes das tabelas estão corretos (case-sensitive)

### Erro: "AUTHENTICATION_REQUIRED"

- Verifique se a `AIRTABLE_API_KEY` está correta
- Certifique-se de que a API key tem permissões adequadas

## 💡 Dicas

1. **Use Views do Airtable**: Você pode filtrar e ordenar dados usando views pré-configuradas no Airtable
2. **Limite de requisições**: O Airtable tem limite de 5 requisições por segundo no plano gratuito
3. **Cache**: Considere implementar cache para reduzir chamadas à API
4. **Webhooks**: Use Airtable Automations ou webhooks para sincronização em tempo real
