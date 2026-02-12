# 🎁 Guia do Sistema de Kits

## Visão Geral

O sistema de kits permite criar pacotes de produtos compostos por múltiplos itens do estoque. Cada kit tem seu próprio preço, imagem e pode ser ativado/desativado independentemente.

## Estrutura do Banco de Dados

### Tabela `kits`
Armazena informações básicas dos kits:

```sql
CREATE TABLE kits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  image_url TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Campos:**
- `id`: Identificador único do kit
- `name`: Nome do kit (ex: "Kit Festa Completo")
- `description`: Descrição opcional do kit
- `price`: Preço do kit (pode ser diferente da soma dos itens)
- `image_url`: URL da imagem do kit (via upload R2)
- `is_active`: Status do kit (1 = ativo, 0 = inativo)
- `created_at`: Data/hora de criação
- `updated_at`: Data/hora da última atualização

### Tabela `kit_items`
Relaciona kits com itens do estoque:

```sql
CREATE TABLE kit_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kit_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (kit_id) REFERENCES kits(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  UNIQUE(kit_id, item_id)
);
```

**Campos:**
- `id`: Identificador único da relação
- `kit_id`: ID do kit (relaciona com tabela `kits`)
- `item_id`: ID do item (relaciona com tabela `items`)
- `quantity`: Quantidade deste item incluída no kit
- `UNIQUE(kit_id, item_id)`: Garante que um item não seja adicionado duas vezes ao mesmo kit

**Exemplo de dados:**
```sql
-- Kit "Festa Completo" (id=1) contém:
INSERT INTO kit_items (kit_id, item_id, quantity) VALUES
  (1, 5, 2),   -- 2 bandejas retangulares
  (1, 8, 50),  -- 50 copos descartáveis
  (1, 12, 1);  -- 1 toalha de mesa
```

## API Endpoints

### GET /api/kits
Lista todos os kits (com opção de filtrar apenas ativos)

**Query Parameters:**
- `activeOnly=true` - Retorna apenas kits ativos
- `maxRecords=10` - Limita número de resultados

**Response:**
```json
[
  {
    "id": 1,
    "name": "Kit Festa Completo",
    "description": "Tudo para sua festa",
    "price": 350.00,
    "image_url": "/api/upload?key=kits/...",
    "is_active": 1
  }
]
```

### GET /api/kits?id=1
Busca um kit específico com todos os itens incluídos

**Response:**
```json
{
  "id": 1,
  "name": "Kit Festa Completo",
  "description": "Tudo para sua festa",
  "price": 350.00,
  "image_url": "/api/upload?key=kits/...",
  "is_active": 1,
  "items": [
    {
      "id": 15,
      "item_id": 5,
      "item_name": "Bandeja Retangular",
      "quantity": 2
    },
    {
      "id": 16,
      "item_id": 8,
      "item_name": "Copo Descartável",
      "quantity": 50
    }
  ]
}
```

### POST /api/kits
Cria um novo kit

**Request Body:**
```json
{
  "name": "Kit Aniversário",
  "description": "Kit completo para aniversário",
  "price": 250.00,
  "image_url": "/api/upload?key=kits/1234-kit-aniversario.jpg",
  "is_active": 1
}
```

**Response:** Kit criado com ID

### PUT /api/kits?id=1
Atualiza um kit existente

**Request Body:** Mesma estrutura do POST (todos os campos opcionais)

### DELETE /api/kits?id=1
Deleta um kit (e automaticamente remove todos os kit_items relacionados via CASCADE)

## Gerenciamento de Itens do Kit

### POST /api/kit-items
Adiciona um item ao kit

**Request Body:**
```json
{
  "kit_id": 1,
  "item_id": 5,
  "quantity": 2
}
```

### PUT /api/kit-items?id=15
Atualiza a quantidade de um item no kit

**Request Body:**
```json
{
  "quantity": 3
}
```

### DELETE /api/kit-items?id=15
Remove um item do kit

## Interface Admin

### Página `/admin/kits`

**Funcionalidades:**

1. **Listar Kits**
   - Mostra todos os kits cadastrados
   - Exibe status (ativo/inativo)
   - Mostra preço e descrição

2. **Criar/Editar Kit**
   - Formulário com campos: nome, descrição, preço
   - Upload de imagem via componente ImageUpload
   - Checkbox para ativar/desativar

3. **Gerenciar Itens do Kit**
   - Modal que lista todos os itens do kit
   - Adicionar novos itens (dropdown + quantidade)
   - Remover itens existentes
   - Ver composição completa do kit

4. **Deletar Kit**
   - Confirmação antes de deletar
   - Remove automaticamente todos os kit_items

## Integração com Reservas

Quando um kit é reservado:

1. Sistema verifica disponibilidade de TODOS os itens do kit
2. Cria uma entrada na tabela `reservations` com:
   - `reservation_type = 'kit'`
   - `kit_id = [ID do kit]`
   - `quantity = 1` (kits são vendidos unitariamente)

3. Para cada item do kit, cria uma entrada em `reservation_items`:
   - `item_id` = ID do item
   - `quantity` = quantidade definida no kit_items
   - `date_from` e `date_to` = período da reserva

Exemplo:
```sql
-- Reserva do "Kit Festa Completo"
INSERT INTO reservations (reservation_type, kit_id, customer_name, date_from, date_to)
VALUES ('kit', 1, 'João Silva', '2026-03-15', '2026-03-16');

-- Bloqueia itens do kit (automaticamente)
INSERT INTO reservation_items (reservation_id, item_id, quantity, date_from, date_to)
VALUES
  (100, 5, 2, '2026-03-15', '2026-03-16'),   -- 2 bandejas
  (100, 8, 50, '2026-03-15', '2026-03-16'),  -- 50 copos
  (100, 12, 1, '2026-03-15', '2026-03-16');  -- 1 toalha
```

## Verificação de Disponibilidade

Antes de confirmar uma reserva de kit, o sistema verifica se TODOS os itens estão disponíveis no período solicitado usando a API `/api/availability`.

Se qualquer item do kit não tiver quantidade suficiente disponível, a reserva é rejeitada com mensagem clara indicando qual item está indisponível.

## Catálogo Público

### Página `/catalog`

Os kits aparecem na aba "🎁 Kits" do catálogo público:

- Apenas kits com `is_active = 1` são exibidos
- Cards mostram: imagem, nome, descrição, preço
- Lista de itens incluídos (com quantidades)
- Botão "Reservar" adiciona ao carrinho

**Diferença entre kits e itens individuais:**
- Kits: quantidade fixa = 1 (não pode escolher quantidade)
- Itens: cliente pode escolher quantidade (1-10)

## Upload de Imagens

As imagens dos kits são armazenadas no Cloudflare R2:

**Pasta:** `kits/`
**Formato:** `kits/[timestamp]-[nome-sanitizado].[ext]`
**Tamanho máximo:** 5MB
**Tipos permitidos:** JPEG, PNG, GIF, WEBP

**Processo:**
1. Admin usa o componente ImageUpload na página de kits
2. Imagem é enviada para `/api/upload` com `folder=kits`
3. R2 retorna URL pública da imagem
4. URL é salva no campo `image_url` do kit

## Boas Práticas

1. **Preço do Kit**
   - Pode ser menor que a soma dos itens (promoção)
   - Ou maior (conveniência de kit montado)

2. **Imagens**
   - Use imagens representativas do kit montado
   - Não apenas dos itens individuais

3. **Descrição**
   - Liste os benefícios do kit
   - Mencione ocasiões de uso
   - Exemplo: "Ideal para festas de até 50 pessoas"

4. **Composição**
   - Agrupe itens que fazem sentido juntos
   - Considere a disponibilidade em estoque
   - Evite itens muito raros em kits

5. **Status**
   - Desative kits temporariamente se faltarem itens
   - Não delete kits com histórico de reservas

## Troubleshooting

### Kit não aparece no catálogo
- Verifique se `is_active = 1`
- Confirme que tem itens adicionados
- Verifique se tem imagem configurada

### Erro ao reservar kit
- Um ou mais itens podem estar indisponíveis
- Verifique estoque de cada item
- Consulte reservas conflitantes em `/admin/reservations`

### Kit deletado acidentalmente
- Não há recuperação automática
- Recrie o kit manualmente
- Considere fazer backups periódicos do banco

## Exemplos de Kits

### Kit Festa Infantil
```json
{
  "name": "Kit Festa Infantil",
  "description": "Tudo para a festa do seu pequeno",
  "price": 180.00,
  "items": [
    { "item": "Toalha de Mesa", "quantity": 1 },
    { "item": "Copo Descartável", "quantity": 30 },
    { "item": "Prato Descartável", "quantity": 30 },
    { "item": "Bandeja Redonda", "quantity": 2 }
  ]
}
```

### Kit Churrasco
```json
{
  "name": "Kit Churrasco Premium",
  "description": "Para um churrasco inesquecível",
  "price": 420.00,
  "items": [
    { "item": "Mesa Dobrável", "quantity": 2 },
    { "item": "Cadeiras", "quantity": 10 },
    { "item": "Churrasqueira", "quantity": 1 },
    { "item": "Cooler", "quantity": 2 }
  ]
}
```

## Próximos Passos

- [ ] Relatório de kits mais vendidos
- [ ] Sugestão de kits baseada em histórico
- [ ] Descontos progressivos para múltiplos kits
- [ ] Kits personalizáveis pelo cliente
