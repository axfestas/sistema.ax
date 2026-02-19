# Teste de Email - Ax Festas

Documentação sobre como usar a página de teste de emails do sistema.

## Como Acessar

1. Acesse o painel admin em `/admin`
2. No menu lateral, clique em **✉️ Teste Email**
3. Ou acesse diretamente: `/admin/test-email`

## Como Usar

1. Insira o **email destinatário** no campo de texto (o email de teste será entregue neste endereço)
2. Clique em **Enviar Teste** para o tipo de email desejado:
   - **Confirmação de Reserva** — simula o email enviado ao confirmar uma reserva
   - **Recuperação de Senha** — simula o email de redefinição de senha

## Como Interpretar os Resultados

Os resultados aparecem abaixo do formulário logo após o envio:

| Ícone | Significado |
|-------|-------------|
| ✅    | Email enviado com sucesso pelo Resend |
| ❌    | Falha no envio — verifique os detalhes do erro |

### Erros Comuns

| Mensagem de Erro | Causa Provável | Solução |
|-----------------|----------------|---------|
| `Email service not configured` | `RESEND_API_KEY` não definida | Configurar a variável no Cloudflare Dashboard |
| `Erro ao conectar com o serviço de email` | Problema de rede ou endpoint fora do ar | Verificar logs do Worker no Cloudflare |
| `Email inválido` | Formato de email incorreto | Corrigir o endereço informado |

## Configuração de Email

Todos os emails do sistema são enviados pelo endereço:

```
Ax Festas <noreply@axfestas.com.br>
```

### Variáveis de Ambiente Necessárias (Cloudflare)

| Variável | Descrição |
|----------|-----------|
| `RESEND_API_KEY` | Chave de API do Resend para envio de emails |
| `ADMIN_EMAIL` | Email do administrador para notificações de novas solicitações (padrão: `alex.fraga@axfestas.com.br`). Usado por `functions/api/reservation-request.ts`, não pela página de teste. |

## Arquivos de Email no Sistema

Os seguintes arquivos enviam emails e usam `noreply@axfestas.com.br`:

- `src/lib/email.ts` — funções auxiliares de envio
- `functions/api/email/send-reservation-confirmation.ts` — endpoint de confirmação de reserva
- `functions/api/email/send-password-reset.ts` — endpoint de recuperação de senha
- `functions/api/reservation-request.ts` — notificação de nova solicitação (admin + cliente)
- `functions/api/reservation-requests.ts` — emails de aprovação/rejeição de solicitações

## Verificando no Dashboard do Resend

1. Acesse [resend.com](https://resend.com) e faça login
2. Vá em **Emails** no menu lateral para ver o histórico de envios
3. Cada email exibe: destinatário, status (delivered/bounced/failed), data e horário
4. Em caso de bounces ou falhas, verifique os detalhes do evento para entender o problema

## Troubleshooting

### Email não chegou na caixa de entrada

- Verifique a pasta de spam/lixo eletrônico
- Confirme que o email destinatário está correto
- Verifique no dashboard do Resend se o email aparece como "delivered"
- Aguarde alguns minutos — pode haver atraso na entrega

### Erro 500 ao enviar

- Verifique se a variável `RESEND_API_KEY` está configurada no Cloudflare
- Confirme que a chave de API está válida e ativa no Resend
- Verifique os logs do Worker em Cloudflare → Workers → seu worker → Logs

### Domínio não verificado

- O domínio `axfestas.com.br` deve estar verificado no Resend
- Acesse Resend → Domains para verificar o status
- Registros DNS necessários: SPF, DKIM e DMARC
