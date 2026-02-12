# 📊 Guia de Controle de Estoque Inteligente

## Visão Geral

O sistema de controle de estoque rastreia a disponibilidade de itens considerando todas as reservas ativas (tanto de itens individuais quanto de kits). Isso evita overbooking e garante que os itens estejam disponíveis quando prometidos aos clientes.

## Estrutura do Banco de Dados

### Tabela `reservation_items`

Rastreia cada item individual bloqueado por reservas:

```sql
CREATE TABLE reservation_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id)
);

-- Índice para consultas rápidas de disponibilidade
CREATE INDEX idx_reservation_items_item_dates 
  ON reservation_items(item_id, date_from, date_to);
```

**Por que essa tabela é necessária?**

Sem ela, seria impossível saber exatamente quais itens estão bloqueados quando:
- Um kit é reservado (múltiplos itens)
- Um item individual é reservado várias vezes
- Há sobreposição de datas entre reservas

### Tabela `reservations` (atualizada)

Adicionados campos para suportar kits:

```sql
ALTER TABLE reservations ADD COLUMN reservation_type TEXT DEFAULT 'unit';
ALTER TABLE reservations ADD COLUMN kit_id INTEGER;
```

**Campos importantes:**
- `reservation_type`: 'kit' ou 'unit'
- `kit_id`: ID do kit (se reservation_type = 'kit')
- `item_id`: ID do item (se reservation_type = 'unit')

## Fluxo de Verificação de Disponibilidade

### 1. Quando Cliente Reserva Item Individual

```mermaid
Cliente → Adiciona item ao carrinho (quantidade: 3)
       ↓
Sistema → Verifica disponibilidade via /api/availability
       ↓
       ├→ Disponível? → Permite adicionar ao carrinho
       └→ Indisponível? → Mostra mensagem de erro
```

**Cálculo:**
```typescript
estoque_total = items.quantity
bloqueado = SUM(reservation_items.quantity) 
  WHERE item_id = X 
  AND dates overlap with período solicitado
disponível = estoque_total - bloqueado
```

### 2. Quando Cliente Reserva Kit

```mermaid
Cliente → Seleciona kit
       ↓
Sistema → Busca todos os itens do kit
       ↓
       → Para CADA item do kit:
          ├→ Verifica disponibilidade
          └→ Se TODOS disponíveis → Permite reserva
             Se ALGUM indisponível → Rejeita e informa qual item
```

**Exemplo:**

Kit "Festa Completo" contém:
- 2× Bandeja (item_id: 5)
- 50× Copos (item_id: 8)
- 1× Toalha (item_id: 12)

Sistema verifica:
```sql
-- Para cada item:
SELECT 
  i.quantity as estoque_total,
  COALESCE(SUM(ri.quantity), 0) as bloqueado
FROM items i
LEFT JOIN reservation_items ri ON i.id = ri.item_id
  AND ri.date_from <= '2026-03-16'  -- fim da nova reserva
  AND ri.date_to >= '2026-03-15'     -- início da nova reserva
WHERE i.id IN (5, 8, 12)
GROUP BY i.id
```

Se disponível para todos:
```sql
-- Cria reserva
INSERT INTO reservations (reservation_type, kit_id, customer_name, ...)
VALUES ('kit', 1, 'João Silva', ...);

-- Bloqueia cada item do kit
INSERT INTO reservation_items (reservation_id, item_id, quantity, date_from, date_to)
VALUES
  (101, 5, 2, '2026-03-15', '2026-03-16'),
  (101, 8, 50, '2026-03-15', '2026-03-16'),
  (101, 12, 1, '2026-03-15', '2026-03-16');
```

## API de Disponibilidade

### POST /api/availability

Verifica se um item está disponível em determinado período.

**Request:**
```json
{
  "item_id": 5,
  "date_from": "2026-03-15",
  "date_to": "2026-03-16",
  "quantity": 2
}
```

**Response (Disponível):**
```json
{
  "available": true,
  "quantity_available": 8,
  "quantity_blocked": 2,
  "total_stock": 10,
  "item_name": "Bandeja Retangular"
}
```

**Response (Indisponível):**
```json
{
  "available": false,
  "quantity_available": 1,
  "quantity_blocked": 9,
  "total_stock": 10,
  "item_name": "Bandeja Retangular"
}
```

### Lógica de Sobreposição de Datas

Duas reservas se sobrepõem se:

```
Reserva A: [data_inicio_A, data_fim_A]
Reserva B: [data_inicio_B, data_fim_B]

Sobrepõem se:
  (data_inicio_A <= data_fim_B) AND (data_fim_A >= data_inicio_B)
```

**Exemplos:**

```
✓ SOBREPÕEM
Reserva A: [15/03, 16/03]
Reserva B: [16/03, 17/03]  (compartilham dia 16)

✓ SOBREPÕEM
Reserva A: [15/03, 20/03]
Reserva B: [17/03, 18/03]  (B está dentro de A)

✗ NÃO SOBREPÕEM
Reserva A: [15/03, 16/03]
Reserva B: [17/03, 18/03]  (sem dias em comum)
```

## Cenários de Uso

### Cenário 1: Reserva Simples de Item

**Situação:**
- Item: Cadeira (ID: 3)
- Estoque: 20 unidades
- Cliente quer: 5 cadeiras
- Período: 20-21/03

**Processo:**
1. Verifica reservas existentes no período
2. Soma quantidades bloqueadas
3. Calcula: disponível = 20 - bloqueado
4. Se disponível >= 5, permite reserva
5. Cria registro em `reservation_items`

### Cenário 2: Múltiplas Reservas Simultâneas

**Situação:**
- Item: Mesa (ID: 10)
- Estoque: 5 unidades
- Reservas existentes no dia 20/03:
  - Cliente A: 2 mesas (19-21/03)
  - Cliente B: 2 mesas (20-22/03)
- Cliente C quer: 2 mesas (20/03)

**Cálculo:**
```
total_estoque = 5
bloqueado (Cliente A) = 2
bloqueado (Cliente B) = 2
disponível = 5 - 2 - 2 = 1
requisição = 2

Resultado: INDISPONÍVEL (só tem 1, precisa de 2)
```

### Cenário 3: Kit com Item Limitado

**Situação:**
- Kit "Festa Premium" contém:
  - 10 cadeiras (estoque: 50)
  - 2 mesas (estoque: 5)
  - 1 som (estoque: 2)
- Cliente quer: 1 kit no dia 25/03

**Processo:**
1. Verifica disponibilidade de cada item:
   - Cadeiras: ✓ (10 de 50 disponível)
   - Mesas: ✓ (2 de 5 disponível)
   - Som: ? (verificar bloqueios)

2. Se som tiver 2 unidades bloqueadas → REJEITA
   Mensagem: "Item 'Som Profissional' indisponível neste período"

3. Se todos disponíveis → ACEITA
   Bloqueia: 10 cadeiras + 2 mesas + 1 som

### Cenário 4: Reserva de Longo Prazo

**Situação:**
- Item: Tenda (ID: 15)
- Estoque: 3 unidades
- Cliente quer: 1 tenda (15-30/03, 15 dias)

**Impacto:**
- Bloqueia 1 tenda por 15 dias
- Afeta disponibilidade de todas as reservas nesse período
- Outras reservas podem usar as 2 tendas restantes

**Exemplo de timeline:**
```
Dia:     15  16  17  18  19  20 ... 30
Tenda 1: [====== Reserva Cliente X ======]
Tenda 2: [ ][ ][ ][ ][ ][ ] ... [ ]  (disponível)
Tenda 3: [ ][ ][ ][ ][ ][ ] ... [ ]  (disponível)
```

## Integração com Reservas

### Ao CRIAR Reserva

**Para item individual:**
```typescript
// 1. Criar reserva
const reservation = await db.insert('reservations', {
  reservation_type: 'unit',
  item_id: itemId,
  quantity: quantity,
  customer_name: name,
  date_from: dateFrom,
  date_to: dateTo
})

// 2. Bloquear item
await db.insert('reservation_items', {
  reservation_id: reservation.id,
  item_id: itemId,
  quantity: quantity,
  date_from: dateFrom,
  date_to: dateTo
})
```

**Para kit:**
```typescript
// 1. Criar reserva
const reservation = await db.insert('reservations', {
  reservation_type: 'kit',
  kit_id: kitId,
  quantity: 1,
  customer_name: name,
  date_from: dateFrom,
  date_to: dateTo
})

// 2. Buscar itens do kit
const kitItems = await db.query(
  'SELECT item_id, quantity FROM kit_items WHERE kit_id = ?',
  [kitId]
)

// 3. Bloquear cada item
for (const kitItem of kitItems) {
  await db.insert('reservation_items', {
    reservation_id: reservation.id,
    item_id: kitItem.item_id,
    quantity: kitItem.quantity,
    date_from: dateFrom,
    date_to: dateTo
  })
}
```

### Ao DELETAR Reserva

Graças ao `ON DELETE CASCADE` na foreign key, ao deletar uma reserva, todos os `reservation_items` relacionados são automaticamente removidos:

```sql
DELETE FROM reservations WHERE id = 101;
-- Automaticamente deleta todos os reservation_items com reservation_id = 101
```

### Ao ATUALIZAR Reserva

Se mudar as datas:
```typescript
// 1. Atualizar reserva
await db.update('reservations', 
  { date_from: newDateFrom, date_to: newDateTo },
  { id: reservationId }
)

// 2. Atualizar reservation_items
await db.update('reservation_items',
  { date_from: newDateFrom, date_to: newDateTo },
  { reservation_id: reservationId }
)
```

## Interface Admin

### Página `/admin/reservations`

**Informações exibidas:**
- Tipo (Kit ou Item Individual)
- Nome do cliente
- Itens reservados (com quantidades)
- Período (data início → fim)
- Status (pendente, confirmada, concluída, cancelada)

**Ações disponíveis:**
- Ver detalhes (lista completa de itens bloqueados)
- Editar (mudar datas, status)
- Cancelar (remove bloqueios automaticamente)
- Confirmar

### Página `/admin/inventory`

**Informações de disponibilidade:**
- Estoque total
- Quantidade bloqueada (hoje)
- Disponível para novas reservas

**Visualização futura:**
- Calendário mostrando períodos de alta demanda
- Alertas de itens com baixa disponibilidade

## Performance e Otimização

### Índices Importantes

```sql
-- Acelera verificação de disponibilidade
CREATE INDEX idx_reservation_items_item_dates 
  ON reservation_items(item_id, date_from, date_to);

-- Acelera busca de reservas por período
CREATE INDEX idx_reservations_dates 
  ON reservations(date_from, date_to);

-- Acelera busca de itens de kit
CREATE INDEX idx_kit_items_kit_id 
  ON kit_items(kit_id);
```

### Consultas Otimizadas

**Verificar disponibilidade (otimizada):**
```sql
-- Usa índice para busca rápida
SELECT 
  i.quantity as total,
  COALESCE(SUM(ri.quantity), 0) as blocked
FROM items i
LEFT JOIN reservation_items ri 
  ON i.id = ri.item_id
  AND ri.date_from <= ?  -- data_fim_nova_reserva
  AND ri.date_to >= ?    -- data_inicio_nova_reserva
  AND EXISTS (
    SELECT 1 FROM reservations r 
    WHERE r.id = ri.reservation_id 
    AND r.status != 'cancelled'
  )
WHERE i.id = ?
```

## Boas Práticas

### 1. Validação de Datas
```typescript
// SEMPRE validar que data_fim > data_inicio
if (dateTo <= dateFrom) {
  throw new Error('Data de término deve ser posterior à data de início')
}
```

### 2. Transações
```typescript
// Usar transações ao criar reservas com múltiplos itens
await db.transaction(async (tx) => {
  const reservation = await tx.insert('reservations', data)
  for (const item of items) {
    await tx.insert('reservation_items', {
      reservation_id: reservation.id,
      ...item
    })
  }
})
```

### 3. Status de Reservas
- `pending`: Aguardando confirmação
- `confirmed`: Confirmada pelo admin
- `completed`: Evento realizado
- `cancelled`: Cancelada (não bloqueia estoque)

**Importante:** Apenas reservas com status diferente de 'cancelled' bloqueiam estoque.

### 4. Margem de Segurança
```typescript
// Considerar tempo de preparação/limpeza
const BUFFER_DAYS = 1

// Ao verificar disponibilidade, considerar buffer
const adjustedDateFrom = subtractDays(dateFrom, BUFFER_DAYS)
const adjustedDateTo = addDays(dateTo, BUFFER_DAYS)
```

## Troubleshooting

### Problema: Item aparece disponível mas reserva falha

**Possíveis causas:**
1. Outra reserva foi criada simultaneamente
2. Cache desatualizado no frontend
3. Status da reserva não considerado (incluindo cancelled)

**Solução:**
- Recarregar dados antes de confirmar
- Usar transações para evitar race conditions
- Sempre filtrar por status != 'cancelled'

### Problema: Disponibilidade negativa

**Causa:** Mais itens bloqueados do que em estoque

**Possível origem:**
- Estoque reduzido após reservas criadas
- Migração de dados incorreta
- Bug na criação de reservation_items

**Solução:**
```sql
-- Consulta para detectar
SELECT 
  i.id,
  i.name,
  i.quantity as stock,
  SUM(ri.quantity) as blocked,
  (i.quantity - SUM(ri.quantity)) as available
FROM items i
JOIN reservation_items ri ON i.id = ri.item_id
GROUP BY i.id
HAVING available < 0
```

### Problema: Reserva deletada mas itens continuam bloqueados

**Causa:** Falha no CASCADE delete

**Solução:**
```sql
-- Limpar manualmente
DELETE FROM reservation_items 
WHERE reservation_id NOT IN (SELECT id FROM reservations);
```

## Relatórios e Analytics

### Itens Mais Reservados
```sql
SELECT 
  i.name,
  COUNT(DISTINCT ri.reservation_id) as total_reservations,
  SUM(ri.quantity) as total_quantity
FROM items i
JOIN reservation_items ri ON i.id = ri.item_id
JOIN reservations r ON ri.reservation_id = r.id
WHERE r.created_at >= DATE('now', '-30 days')
GROUP BY i.id
ORDER BY total_reservations DESC
LIMIT 10
```

### Taxa de Utilização
```sql
SELECT 
  i.name,
  i.quantity as stock,
  AVG(daily_blocked.blocked) as avg_blocked,
  (AVG(daily_blocked.blocked) / i.quantity * 100) as utilization_rate
FROM items i
JOIN (
  SELECT 
    item_id,
    date_check,
    SUM(quantity) as blocked
  FROM reservation_items ri
  -- Gerar dias e verificar bloqueios
  GROUP BY item_id, date_check
) daily_blocked ON i.id = daily_blocked.item_id
GROUP BY i.id
ORDER BY utilization_rate DESC
```

## Próximos Passos

- [ ] Dashboard de disponibilidade em tempo real
- [ ] Alertas automáticos de baixo estoque
- [ ] Previsão de demanda baseada em histórico
- [ ] Sistema de waitlist para itens esgotados
- [ ] Otimização de rotas de entrega baseada em reservas
