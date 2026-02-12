# 🔗 Exemplo de Integração: Email em Reservas

Este arquivo mostra como integrar o sistema de email com a criação e atualização de reservas.

## 📝 Exemplo 1: Enviar Email ao Criar Reserva

### No arquivo `functions/api/reservations.ts`

Adicione o código de envio de email após criar a reserva com sucesso:

```typescript
// Após criar a reserva
const newReservation = await createReservation(db, reservation);

// Se temos email do cliente, enviar confirmação
if (newReservation.customer_email && context.env.RESEND_API_KEY) {
  try {
    // Buscar itens da reserva
    const reservationItems = await getReservationItems(db, newReservation.id);
    
    // Formatar lista de itens para o email
    let itemsList = '';
    if (reservationItems && reservationItems.length > 0) {
      itemsList = '<ul style="margin: 10px 0; padding-left: 20px;">';
      for (const item of reservationItems) {
        itemsList += `<li style="padding: 5px 0;">${item.quantity}× ${item.item_name}</li>`;
      }
      itemsList += '</ul>';
    } else {
      itemsList = '<p>Nenhum item especificado</p>';
    }
    
    // Enviar email de confirmação
    await fetch(`${context.request.url.origin}/api/email/send-reservation-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: newReservation.customer_email,
        customerName: newReservation.customer_name,
        reservationId: newReservation.id,
        status: newReservation.status,
        dateFrom: newReservation.date_from,
        dateTo: newReservation.date_to,
        itemsList: itemsList
      })
    });
    
    console.log(`Email de confirmação enviado para ${newReservation.customer_email}`);
  } catch (emailError) {
    // Log mas não falha a operação se email falhar
    console.error('Erro ao enviar email de confirmação:', emailError);
  }
}
```

## 📝 Exemplo 2: Enviar Email ao Atualizar Status

### No endpoint PUT de reservas

Quando o status for atualizado para "confirmed", enviar email:

```typescript
// Após atualizar a reserva
const updatedReservation = await updateReservation(db, reservationId, updates);

// Se status mudou para "confirmed" e temos email
if (updates.status === 'confirmed' && 
    updatedReservation.customer_email && 
    context.env.RESEND_API_KEY) {
  try {
    // Buscar itens da reserva
    const reservationItems = await getReservationItems(db, reservationId);
    
    // Formatar lista de itens
    let itemsList = '<ul style="margin: 10px 0; padding-left: 20px;">';
    for (const item of reservationItems) {
      itemsList += `<li style="padding: 5px 0;">${item.quantity}× ${item.item_name}</li>`;
    }
    itemsList += '</ul>';
    
    // Enviar email
    await fetch(`${context.request.url.origin}/api/email/send-reservation-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: updatedReservation.customer_email,
        customerName: updatedReservation.customer_name,
        reservationId: updatedReservation.id,
        status: 'confirmed',
        dateFrom: updatedReservation.date_from,
        dateTo: updatedReservation.date_to,
        itemsList: itemsList
      })
    });
    
    console.log(`Email de confirmação enviado para ${updatedReservation.customer_email}`);
  } catch (emailError) {
    console.error('Erro ao enviar email:', emailError);
  }
}
```

## 📝 Exemplo 3: Enviar Email do Formulário de Carrinho

### No arquivo `src/app/cart/page.tsx`

Ao finalizar o checkout, enviar email:

```typescript
const handleCheckout = async () => {
  // ... código existente de criar reserva ...
  
  // Após criar a reserva com sucesso
  if (formData.email) {
    try {
      // Formatar lista de itens do carrinho
      let itemsList = '<ul style="margin: 10px 0; padding-left: 20px;">';
      cart.forEach(item => {
        itemsList += `<li style="padding: 5px 0;">${item.name} - R$ ${item.price.toFixed(2)}</li>`;
      });
      itemsList += '</ul>';
      
      // Enviar email
      const emailResponse = await fetch('/api/email/send-reservation-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: formData.email,
          customerName: formData.name,
          reservationId: reservationId, // ID retornado ao criar reserva
          status: 'pending',
          dateFrom: formData.dateFrom,
          dateTo: formData.dateTo,
          itemsList: itemsList
        })
      });
      
      const emailResult = await emailResponse.json();
      if (emailResult.success) {
        console.log('Email de confirmação enviado!');
      }
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      // Não bloqueia o checkout se email falhar
    }
  }
  
  // Limpar carrinho e redirecionar
  clearCart();
  router.push('/catalog');
};
```

## 📝 Exemplo 4: Testar API de Email Diretamente

### Via cURL

```bash
# Testar email de confirmação de reserva
curl -X POST https://axfestas.com.br/api/email/send-reservation-confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "to": "cliente@example.com",
    "customerName": "João Silva",
    "reservationId": 123,
    "status": "confirmed",
    "dateFrom": "2026-03-10",
    "dateTo": "2026-03-12",
    "itemsList": "<ul><li>10× Cadeiras</li><li>2× Mesas</li></ul>"
  }'
```

```bash
# Testar email de recuperação de senha
curl -X POST https://axfestas.com.br/api/email/send-password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "to": "usuario@example.com",
    "userName": "Maria Santos",
    "resetLink": "https://axfestas.com.br/reset-password?token=abc123"
  }'
```

### Via JavaScript Console (Browser DevTools)

```javascript
// Testar no console do navegador
await fetch('/api/email/send-reservation-confirmation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'seu-email@example.com',
    customerName: 'Teste',
    reservationId: 999,
    status: 'pending',
    dateFrom: '2026-03-10',
    dateTo: '2026-03-12',
    itemsList: '<ul><li>Item de teste</li></ul>'
  })
}).then(r => r.json()).then(console.log);
```

## 🎯 Boas Práticas

### 1. Sempre Use Try-Catch

```typescript
try {
  await fetch('/api/email/...');
} catch (error) {
  console.error('Erro ao enviar email:', error);
  // Não deixe o erro de email quebrar o fluxo principal
}
```

### 2. Verifique se Email Está Disponível

```typescript
if (customer_email && context.env.RESEND_API_KEY) {
  // Enviar email
}
```

### 3. Log de Sucesso e Erro

```typescript
const result = await fetch('/api/email/...');
const data = await result.json();

if (data.success) {
  console.log('✅ Email enviado com sucesso');
} else {
  console.error('❌ Erro ao enviar email:', data.error);
}
```

### 4. Não Bloqueie Operação Principal

O envio de email deve ser **opcional** - se falhar, a reserva/operação principal ainda deve funcionar:

```typescript
// ✅ BOM: Email não bloqueia
const reservation = await createReservation(db, data);

// Tentar enviar email (não await)
sendEmailAsync(reservation).catch(console.error);

return { success: true, reservation };

// ❌ RUIM: Email bloqueia
const reservation = await createReservation(db, data);
await sendEmail(reservation); // Se falhar, a reserva não é retornada!
return { success: true, reservation };
```

## 🔍 Debug e Troubleshooting

### Ver Logs no Cloudflare

1. Acesse Cloudflare Dashboard
2. Workers & Pages > sistema-ax-festas
3. Logs
4. Procure por mensagens como:
   - `Email de confirmação enviado`
   - `Error sending email`
   - `RESEND_API_KEY not configured`

### Testar em Desenvolvimento Local

```javascript
// Use este código no console para testar
const testEmail = async () => {
  const response = await fetch('/api/email/send-reservation-confirmation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: 'SEU_EMAIL_AQUI@example.com',
      customerName: 'Teste Local',
      reservationId: 1,
      status: 'pending',
      dateFrom: '2026-03-10',
      dateTo: '2026-03-12',
      itemsList: '<ul><li>Teste</li></ul>'
    })
  });
  
  const result = await response.json();
  console.log('Resposta:', result);
  
  if (result.success) {
    alert('✅ Email enviado! Verifique sua caixa de entrada.');
  } else {
    alert('❌ Erro: ' + result.error);
  }
};

testEmail();
```

## 📌 Notas Importantes

1. **Templates estão prontos**: Você só precisa chamar as APIs
2. **Configuração simples**: Apenas adicione `RESEND_API_KEY` no Cloudflare
3. **Graceful degradation**: Se email falhar, operação principal continua
4. **Customizável**: Você pode personalizar os templates HTML conforme necessário

---

**Dúvidas?** Consulte o arquivo `EMAIL_GUIDE.md` para documentação completa.
