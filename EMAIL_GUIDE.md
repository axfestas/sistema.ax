# 📧 Sistema de Email - Guia Completo

## 🎯 Visão Geral

O sistema de email do Ax Festas usa o serviço **Resend** para enviar emails transacionais de forma confiável e profissional.

### Funcionalidades Implementadas

1. ✅ **Email de Confirmação de Reserva** - Enviado quando uma reserva é criada ou confirmada
2. ✅ **Email de Recuperação de Senha** - Enviado quando usuárie solicita reset de senha

---

## 🔧 Configuração Inicial

### 1. Obter Chave API do Resend

1. Acesse [resend.com](https://resend.com) e crie uma conta
2. Verifique seu domínio de email (ex: `axfestas.com.br`)
3. Vá em "API Keys" e crie uma nova chave
4. Copie a chave (começa com `re_`)

### 2. Configurar no Cloudflare

**Opção A: Via Dashboard (Recomendado)**

1. Acesse o [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Vá em "Workers & Pages" > "sistema-ax-festas"
3. Clique em "Settings" > "Environment variables"
4. Adicione uma nova variável:
   - **Name:** `RESEND_API_KEY`
   - **Value:** sua chave API (ex: `re_123abc...`)
   - **Type:** Secret (marque a opção "Encrypt")
5. Clique em "Save"

**Opção B: Via Wrangler CLI**

```bash
wrangler secret put RESEND_API_KEY
# Cole sua chave API quando solicitado
```

### 3. Verificar Configuração

A chave API deve estar configurada como **secret** (criptografada) no Cloudflare para segurança.

---

## 📡 APIs Disponíveis

### 1. Enviar Email de Confirmação de Reserva

**Endpoint:** `POST /api/email/send-reservation-confirmation`

**Body (JSON):**
```json
{
  "to": "cliente@example.com",
  "customerName": "João Silva",
  "reservationId": 123,
  "status": "confirmed",
  "dateFrom": "2026-03-10",
  "dateTo": "2026-03-12",
  "itemsList": "<ul><li>10× Cadeiras</li><li>2× Mesas</li></ul>"
}
```

**Campos:**
- `to` (obrigatório): Email do destinatário
- `customerName` (obrigatório): Nome do cliente
- `reservationId` (obrigatório): ID da reserva
- `status` (opcional): Status da reserva (`pending`, `confirmed`, `completed`, `cancelled`)
- `dateFrom` (obrigatório): Data de início (formato: YYYY-MM-DD)
- `dateTo` (obrigatório): Data de fim (formato: YYYY-MM-DD)
- `itemsList` (opcional): HTML com lista de itens

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Email enviado com sucesso",
  "data": {
    "id": "abc123..."
  }
}
```

**Resposta de Erro (400/500):**
```json
{
  "success": false,
  "error": "Email inválido"
}
```

**Exemplo de Uso (JavaScript):**
```javascript
const response = await fetch('/api/email/send-reservation-confirmation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'cliente@example.com',
    customerName: 'João Silva',
    reservationId: 123,
    status: 'confirmed',
    dateFrom: '2026-03-10',
    dateTo: '2026-03-12',
    itemsList: '<ul><li>10× Cadeiras</li></ul>'
  })
});

const result = await response.json();
if (result.success) {
  console.log('Email enviado!');
} else {
  console.error('Erro:', result.error);
}
```

---

### 2. Enviar Email de Recuperação de Senha

**Endpoint:** `POST /api/email/send-password-reset`

**Body (JSON):**
```json
{
  "to": "usuario@example.com",
  "userName": "Maria Santos",
  "resetLink": "https://axfestas.com.br/reset-password?token=abc123"
}
```

**Campos:**
- `to` (obrigatório): Email do destinatário
- `userName` (obrigatório): Nome do usuário
- `resetLink` (obrigatório): Link completo para reset de senha

**Resposta:** Mesma estrutura do endpoint anterior

**Exemplo de Uso:**
```javascript
const response = await fetch('/api/email/send-password-reset', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'usuario@example.com',
    userName: 'Maria Santos',
    resetLink: 'https://axfestas.com.br/reset-password?token=abc123'
  })
});

const result = await response.json();
```

---

## 🔗 Integração com Reservas

### Enviar Email ao Criar Reserva

No arquivo de criação de reservas, adicione após criar a reserva:

```typescript
// Após criar a reserva com sucesso
const reservation = await createReservation(db, reservationData);

// Enviar email de confirmação
if (reservation.customer_email) {
  // Buscar itens da reserva
  const items = await getReservationItems(db, reservation.id);
  
  // Formatar lista de itens
  const itemsList = items.length > 0
    ? '<ul>' + items.map(item => `<li>${item.quantity}× ${item.item_name}</li>`).join('') + '</ul>'
    : '<p>Reserva sem itens especificados</p>';
  
  // Enviar email
  await fetch('/api/email/send-reservation-confirmation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: reservation.customer_email,
      customerName: reservation.customer_name,
      reservationId: reservation.id,
      status: reservation.status,
      dateFrom: reservation.date_from,
      dateTo: reservation.date_to,
      itemsList: itemsList
    })
  });
}
```

### Enviar Email ao Atualizar Status

Quando o status da reserva for atualizado para `confirmed`:

```typescript
// Após atualizar status
if (newStatus === 'confirmed' && reservation.customer_email) {
  await fetch('/api/email/send-reservation-confirmation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: reservation.customer_email,
      customerName: reservation.customer_name,
      reservationId: reservation.id,
      status: 'confirmed',
      dateFrom: reservation.date_from,
      dateTo: reservation.date_to,
      itemsList: '...' // lista de itens
    })
  });
}
```

---

## 🎨 Templates de Email

Os templates estão em `email-templates/` e usam variáveis no formato `{{variableName}}`.

### Template de Confirmação de Reserva

**Arquivo:** `email-templates/reservation-confirmation.html`

**Variáveis disponíveis:**
- `{{customerName}}` - Nome do cliente
- `{{reservationId}}` - ID da reserva
- `{{status}}` - Status formatado (Pendente, Confirmado, etc.)
- `{{dateFrom}}` - Data de início formatada (DD/MM/YYYY)
- `{{dateTo}}` - Data de fim formatada (DD/MM/YYYY)
- `{{itemsList}}` - HTML com lista de itens

### Template de Recuperação de Senha

**Arquivo:** `email-templates/password-reset.html`

**Variáveis disponíveis:**
- `{{userName}}` - Nome do usuário
- `{{resetLink}}` - Link completo para reset

---

## 🐛 Troubleshooting

### Erro: "Email service not configured"

**Causa:** Chave API do Resend não está configurada.

**Solução:**
1. Verifique se `RESEND_API_KEY` está configurada no Cloudflare Dashboard
2. Certifique-se de que está marcada como "Secret"
3. Faça um novo deploy após adicionar a variável

### Erro: "Invalid API key"

**Causa:** Chave API incorreta ou inválida.

**Solução:**
1. Verifique se copiou a chave completa (começa com `re_`)
2. Gere uma nova chave no Resend
3. Atualize no Cloudflare Dashboard

### Email não está sendo enviado

**Possíveis causas:**

1. **Domínio não verificado no Resend**
   - Verifique seu domínio em resend.com
   - Use um domínio verificado no campo `from` dos emails

2. **Email na caixa de spam**
   - Configure SPF, DKIM e DMARC no seu domínio
   - Veja documentação do Resend sobre autenticação

3. **Erro silencioso**
   - Verifique logs no Cloudflare Dashboard
   - Olhe a resposta da API para ver o erro específico

### Erro: "Failed to load email template"

**Causa:** Template não encontrado ou erro ao ler arquivo.

**Solução:**
1. Verifique se os templates estão em `email-templates/`
2. Certifique-se de que os nomes estão corretos:
   - `reservation-confirmation.html`
   - `password-reset.html`
3. Verifique permissões de leitura dos arquivos

---

## 📊 Monitoramento

### Ver Emails Enviados

1. Acesse o [Dashboard do Resend](https://resend.com/emails)
2. Veja histórico de emails enviados
3. Verifique status de entrega, aberturas, etc.

### Logs no Cloudflare

1. Acesse Cloudflare Dashboard
2. Vá em "Workers & Pages" > "sistema-ax-festas"
3. Clique em "Logs" para ver logs em tempo real
4. Procure por mensagens de erro relacionadas a email

---

## 🔒 Segurança

### Boas Práticas

1. ✅ **Nunca** commite a chave API no código
2. ✅ Use sempre variáveis de ambiente (secrets)
3. ✅ Valide emails antes de enviar
4. ✅ Limite rate de envio para prevenir spam
5. ✅ Use templates seguros (escape de HTML quando necessário)

### Rate Limiting (Futuro)

Para evitar abuso, considere implementar:
- Limite de X emails por IP por hora
- Limite de tentativas de reset de senha
- Captcha em formulários públicos

---

## 🚀 Próximos Passos

### Features Adicionais (Opcionais)

1. **Email de Atualização de Status**
   - Notificar quando reserva muda de status
   - Template personalizado para cada status

2. **Email de Lembrete**
   - Lembrar cliente 1 dia antes da retirada
   - Lembrar 1 dia antes da devolução

3. **Email de Boas-vindas**
   - Quando novo usuário é criado pelo admin
   - Incluir senha temporária

4. **Email de Notificação para Admin**
   - Quando nova reserva é criada
   - Quando pagamento é confirmado

### Melhorias Futuras

1. **Suporte a anexos**
   - PDF com detalhes da reserva
   - Contrato de aluguel

2. **Personalização de templates**
   - Interface admin para editar templates
   - Variáveis dinâmicas

3. **Analytics**
   - Taxa de abertura de emails
   - Taxa de cliques em links

---

## 📝 Exemplo Completo

### Cenário: Reserva Criada pelo Cliente

```typescript
// No endpoint de criação de reserva
async function handleCreateReservation(data) {
  // 1. Criar reserva no banco
  const reservation = await createReservation(db, data);
  
  // 2. Criar itens da reserva
  if (data.kit_id) {
    await createReservationItemsForKit(db, reservation.id, data.kit_id, data.date_from, data.date_to);
  }
  
  // 3. Buscar itens para email
  const items = await getReservationItems(db, reservation.id);
  const itemsList = '<ul>' + items.map(i => `<li>${i.quantity}× ${i.item_name}</li>`).join('') + '</ul>';
  
  // 4. Enviar email de confirmação
  if (data.customer_email) {
    await fetch('/api/email/send-reservation-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: data.customer_email,
        customerName: data.customer_name,
        reservationId: reservation.id,
        status: 'pending',
        dateFrom: data.date_from,
        dateTo: data.date_to,
        itemsList: itemsList
      })
    });
  }
  
  return reservation;
}
```

---

## ✅ Checklist de Implementação

Para usar o sistema de email em produção:

- [ ] Criar conta no Resend
- [ ] Verificar domínio de email
- [ ] Obter chave API
- [ ] Configurar `RESEND_API_KEY` no Cloudflare (como secret)
- [ ] Fazer deploy do código atualizado
- [ ] Testar envio de email de teste
- [ ] Integrar com sistema de reservas
- [ ] Monitorar primeiros emails enviados
- [ ] Configurar SPF/DKIM para melhor entregabilidade

---

## 💡 Dicas

1. **Teste em ambiente de desenvolvimento primeiro**
   - Use um email pessoal para testes
   - Verifique se o template está renderizando corretamente

2. **Use emails válidos**
   - Valide formato antes de enviar
   - Não envie para emails descartáveis

3. **Monitore a reputação do seu domínio**
   - Evite ser marcado como spam
   - Mantenha taxa baixa de bounces

4. **Personalize os templates**
   - Use o nome da empresa atual
   - Atualize telefone e endereço de contato

---

**Documentação criada em:** 12/02/2026  
**Última atualização:** 12/02/2026  
**Versão:** 1.0
