# 🚀 Guia Rápido: Integração Airtable

## ✅ O que foi implementado

Agora você pode conectar seu Sistema Ax Festas com o Airtable! 

### Recursos Disponíveis

- ✅ **Cliente Airtable completo** em `src/lib/airtable.ts`
- ✅ **APIs REST** prontas em `/functions/api/`
- ✅ **Documentação completa** em `AIRTABLE_SETUP.md`
- ✅ **Exemplos de código** em `src/lib/airtable-examples.ts`

## 📝 Primeiros Passos (5 minutos)

### 1. Configure suas credenciais

```bash
# Copie o arquivo de exemplo
cp .env.example .env.local

# Edite com suas credenciais do Airtable
# AIRTABLE_API_KEY=keyXXXXXXXXXXXXXX
# AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
```

### 2. Obtenha suas credenciais Airtable

**API Key:**
1. Entre no Airtable → Clique no seu avatar
2. Account → Generate API key
3. Copie a chave (começa com `key...`)

**Base ID:**
1. Abra sua base no Airtable
2. Help → API Documentation
3. Copie o Base ID (começa com `app...`)

### 3. Crie suas tabelas no Airtable

Veja a estrutura recomendada em `AIRTABLE_SETUP.md`, seção "Estrutura das Tabelas"

Tabelas necessárias:
- **Items** - Itens para aluguel
- **Reservations** - Reservas de clientes
- **Maintenance** - Manutenções
- **Finance** - Controle financeiro

### 4. Teste localmente

```bash
npm run dev
```

## 💻 Exemplos de Uso

### Buscar itens disponíveis

```typescript
import { getItems } from '@/lib/airtable';

const items = await getItems({
  filterByFormula: "{status} = 'available'",
  maxRecords: 20
});
```

### Criar nova reserva

```typescript
import { createReservation } from '@/lib/airtable';

const reserva = await createReservation({
  customerName: 'João Silva',
  customerEmail: 'joao@example.com',
  eventDate: '2026-04-15',
  totalValue: 500.00,
  status: 'pending'
});
```

### Usar via API (em componentes client)

```typescript
// Em um componente Next.js
const response = await fetch('/api/items?status=available');
const items = await response.json();
```

## 🌐 Deploy no Cloudflare

Quando fizer deploy, adicione as variáveis de ambiente no Dashboard:

1. Cloudflare Dashboard → Sua aplicação Pages
2. Settings → Environment variables
3. Adicionar:
   - `AIRTABLE_API_KEY`
   - `AIRTABLE_BASE_ID`
   - `AIRTABLE_ITEMS_TABLE`
   - `AIRTABLE_RESERVATIONS_TABLE`
   - `AIRTABLE_MAINTENANCE_TABLE`
   - `AIRTABLE_FINANCE_TABLE`

## 📚 Documentação Completa

- **Setup detalhado:** [AIRTABLE_SETUP.md](./AIRTABLE_SETUP.md)
- **Exemplos de código:** [src/lib/airtable-examples.ts](./src/lib/airtable-examples.ts)
- **Código principal:** [src/lib/airtable.ts](./src/lib/airtable.ts)

## 🆘 Precisa de Ajuda?

Veja a seção "Problemas Comuns" em `AIRTABLE_SETUP.md`

## 🎯 Próximos Passos

1. Configure suas credenciais no `.env.local`
2. Crie as tabelas no Airtable
3. Teste as APIs localmente
4. Integre nos componentes do seu sistema
5. Faça deploy no Cloudflare Pages

---

**Pronto para começar!** 🎉

Toda a documentação detalhada está em `AIRTABLE_SETUP.md`
