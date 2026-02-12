# 📧 Como Funciona o Sistema de Email - Resumo Visual

## 🎯 Visão Geral Simples

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE EMAIL AX FESTAS                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Cliente faz reserva no site                                │
│  2. Sistema cria reserva no banco de dados                     │
│  3. Sistema chama API de email                                 │
│  4. API carrega template HTML                                  │
│  5. API substitui variáveis (nome, datas, etc)                 │
│  6. API envia email via Resend                                 │
│  7. Cliente recebe email na caixa de entrada                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Fluxo Detalhado

### 1️⃣ Cliente Faz Reserva

```
┌──────────────┐
│   CLIENTE    │
│  no site     │
└──────┬───────┘
       │
       │ Preenche formulário
       │ (nome, email, datas)
       ▼
┌──────────────┐
│   SISTEMA    │
│  cria        │
│  reserva     │
└──────┬───────┘
       │
       │ Reserva criada #123
       ▼
```

### 2️⃣ Sistema Prepara Email

```
┌─────────────────────────────────────────┐
│  CÓDIGO DO SISTEMA                      │
├─────────────────────────────────────────┤
│                                         │
│  if (cliente tem email) {               │
│    // Preparar dados                   │
│    const dados = {                      │
│      to: 'cliente@email.com',          │
│      customerName: 'João Silva',       │
│      reservationId: 123,               │
│      dateFrom: '2026-03-10',           │
│      dateTo: '2026-03-12',             │
│      itemsList: '<ul>...</ul>'         │
│    }                                    │
│                                         │
│    // Chamar API de email              │
│    await fetch('/api/email/send...')   │
│  }                                      │
│                                         │
└─────────────────────────────────────────┘
```

### 3️⃣ API Processa e Envia

```
┌─────────────────────────────────────────┐
│  API DE EMAIL                           │
├─────────────────────────────────────────┤
│                                         │
│  1. Recebe dados do sistema            │
│  2. Valida campos (email válido?)      │
│  3. Verifica RESEND_API_KEY            │
│  4. Carrega template HTML              │
│  5. Substitui {{variáveis}}            │
│  6. Envia via Resend                   │
│  7. Retorna sucesso ou erro            │
│                                         │
└─────────────────────────────────────────┘
```

### 4️⃣ Cliente Recebe Email

```
┌──────────────────────────────────┐
│  CAIXA DE ENTRADA DO CLIENTE     │
├──────────────────────────────────┤
│                                  │
│  De: Ax Festas                   │
│  Para: cliente@email.com         │
│  Assunto: Confirmação de         │
│           Reserva #123           │
│                                  │
│  ┌────────────────────────────┐  │
│  │ 🎉 Reserva Confirmada!     │  │
│  │                            │  │
│  │ Olá, João Silva!           │  │
│  │                            │  │
│  │ 📋 Detalhes da Reserva     │  │
│  │ ID: #123                   │  │
│  │ De: 10/03/2026             │  │
│  │ Até: 12/03/2026            │  │
│  │                            │  │
│  │ 📦 Itens:                  │  │
│  │ • 10× Cadeiras             │  │
│  │ • 2× Mesas                 │  │
│  └────────────────────────────┘  │
│                                  │
└──────────────────────────────────┘
```

---

## 🔧 Componentes do Sistema

### Arquivos Criados

```
email-templates/
├── reservation-confirmation.html  ← Template de confirmação
└── password-reset.html           ← Template de reset de senha

src/lib/
└── email.ts                      ← Funções helper

functions/api/email/
├── send-reservation-confirmation.ts  ← API de confirmação
└── send-password-reset.ts           ← API de reset

Documentação/
├── EMAIL_GUIDE.md                   ← Guia completo
└── EMAIL_INTEGRATION_EXAMPLES.md    ← Exemplos de código
```

### Como os Templates Funcionam

**ANTES (Template com variáveis):**
```html
<p>Olá, <strong>{{customerName}}</strong>!</p>
<p>ID da Reserva: #{{reservationId}}</p>
<p>Data: {{dateFrom}} até {{dateTo}}</p>
```

**DEPOIS (Email enviado):**
```html
<p>Olá, <strong>João Silva</strong>!</p>
<p>ID da Reserva: #123</p>
<p>Data: 10/03/2026 até 12/03/2026</p>
```

---

## 🚀 Como Usar - 3 Passos Simples

### PASSO 1: Configurar Resend (uma vez só)

```
1. Criar conta em resend.com
2. Verificar seu domínio (axfestas.com.br)
3. Gerar chave API (re_abc123...)
```

### PASSO 2: Configurar no Cloudflare (uma vez só)

```
1. Cloudflare Dashboard
2. Workers & Pages → sistema-ax-festas
3. Settings → Environment variables
4. Add:
   - Name: RESEND_API_KEY
   - Value: re_abc123...
   - Type: Secret ✓
```

### PASSO 3: Usar no Código

```typescript
// É só chamar a API! Simples assim:
await fetch('/api/email/send-reservation-confirmation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'cliente@email.com',
    customerName: 'João Silva',
    reservationId: 123,
    dateFrom: '2026-03-10',
    dateTo: '2026-03-12',
    itemsList: '<ul><li>Item 1</li></ul>'
  })
});

// Pronto! Email enviado! 🎉
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Email ao Criar Reserva

```typescript
// No código de criar reserva
const reserva = await criarReserva(dados);

// Enviar email (não trava se falhar)
if (reserva.customer_email) {
  fetch('/api/email/send-reservation-confirmation', {
    method: 'POST',
    body: JSON.stringify({
      to: reserva.customer_email,
      customerName: reserva.customer_name,
      reservationId: reserva.id,
      status: 'pending',
      dateFrom: reserva.date_from,
      dateTo: reserva.date_to,
      itemsList: '<ul><li>Items aqui</li></ul>'
    })
  }).catch(err => console.log('Email falhou:', err));
}
```

### Exemplo 2: Email ao Confirmar Reserva

```typescript
// Quando admin confirma a reserva
const confirmar = async (reservaId) => {
  // Atualizar status
  await atualizarReserva(reservaId, { status: 'confirmed' });
  
  // Buscar dados da reserva
  const reserva = await buscarReserva(reservaId);
  
  // Enviar email de confirmação
  if (reserva.customer_email) {
    await fetch('/api/email/send-reservation-confirmation', {
      method: 'POST',
      body: JSON.stringify({
        to: reserva.customer_email,
        customerName: reserva.customer_name,
        reservationId: reserva.id,
        status: 'confirmed', // ← Agora está confirmado!
        dateFrom: reserva.date_from,
        dateTo: reserva.date_to,
        itemsList: '...'
      })
    });
  }
};
```

---

## 🎨 Personalizar Templates

### Onde Editar

Templates estão em: `email-templates/reservation-confirmation.html`

### O Que Pode Mudar

```html
<!-- Mudar cores -->
<div style="background-color: #fbbf24;"> <!-- Cor de fundo -->

<!-- Mudar texto -->
<p>Sua reserva foi confirmada!</p> <!-- Qualquer texto -->

<!-- Adicionar informações -->
<p>Telefone: {{companyPhone}}</p> <!-- Nova variável -->

<!-- Mudar footer -->
<p>📧 contato@axfestas.com.br</p> <!-- Seus dados -->
```

### Variáveis Disponíveis

**Para confirmação de reserva:**
- `{{customerName}}` - Nome do cliente
- `{{reservationId}}` - Número da reserva
- `{{status}}` - Status (Pendente, Confirmado, etc)
- `{{dateFrom}}` - Data início (DD/MM/YYYY)
- `{{dateTo}}` - Data fim (DD/MM/YYYY)
- `{{itemsList}}` - HTML com lista de itens

**Para reset de senha:**
- `{{userName}}` - Nome do usuário
- `{{resetLink}}` - Link para resetar

---

## ✅ Checklist Rápido

Para começar a usar emails:

- [ ] Criar conta no Resend
- [ ] Verificar domínio de email
- [ ] Obter chave API
- [ ] Configurar RESEND_API_KEY no Cloudflare (como Secret)
- [ ] Fazer deploy do código
- [ ] Testar enviando um email
- [ ] Integrar com criação de reservas
- [ ] Personalizar templates (opcional)

---

## 🆘 Problemas Comuns

### "Email service not configured"
❌ **Problema:** RESEND_API_KEY não configurada  
✅ **Solução:** Configure no Cloudflare Dashboard como Secret

### "Invalid API key"
❌ **Problema:** Chave API errada  
✅ **Solução:** Verifique se copiou a chave completa (re_...)

### Email não chegou
❌ **Problema:** Email na spam ou domínio não verificado  
✅ **Solução:** Verifique domínio no Resend e configure SPF/DKIM

### Template não carrega
❌ **Problema:** Arquivo não encontrado  
✅ **Solução:** Certifique que templates estão em `email-templates/`

---

## 📞 Precisa de Ajuda?

1. **Leia primeiro:** `EMAIL_GUIDE.md` (documentação completa)
2. **Veja exemplos:** `EMAIL_INTEGRATION_EXAMPLES.md` (código pronto)
3. **Teste localmente:** Use os exemplos de teste no console
4. **Verifique logs:** Cloudflare Dashboard → Logs

---

## 🎉 Pronto!

Agora você tem um sistema de email profissional, confiável e fácil de usar!

**Recursos:**
- ✅ Templates HTML profissionais
- ✅ APIs prontas para usar
- ✅ Validação automática
- ✅ Documentação completa
- ✅ Exemplos de código
- ✅ Sistema seguro (chaves criptografadas)

**Basta configurar a chave API e começar a usar!** 🚀
