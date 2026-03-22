-- Migration 029: Add contract_clauses table
-- Stores the standard contract clauses so they can be managed via admin panel

CREATE TABLE IF NOT EXISTS contract_clauses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_num INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contract_clauses_order ON contract_clauses(order_num);
CREATE INDEX IF NOT EXISTS idx_contract_clauses_active ON contract_clauses(is_active);

-- Seed default clauses
INSERT INTO contract_clauses (order_num, title, content) VALUES
(1, '01. Do Objeto da Locação',
 'A locadora Ax Festas disponibiliza a locação de mobiliário e objetos destinados à realização de festas e eventos em geral. Os itens especificados no pedido abaixo fazem parte deste contrato e foram solicitados no momento da contratação.'),

(2, '02. Das Retiradas e Devoluções',
 '2.1. As retiradas e devoluções dos itens locados deverão ser realizadas com 24 (vinte e quatro) horas de antecedência ou na data do evento, no endereço Rua Jacintha de Paulo Ferreira, nº 12, Bairro André Carloni, Serra/ES, CEP: 29161-820.
2.2. Todo o material locado deve ser devolvido no mesmo local em que foram retirados.
2.3. Os itens locados serão entregues limpos e sem avarias, devidamente embalados.
2.4. No ato da recepção e devolução, os bens locados deverão ser conferidos pelo Locatário(a/e) e Locador(a/e).
2.5. Em caso de necessidade de reposição ou danos nos itens locados, será de responsabilidade do Locatário(a/e).'),

(3, '03. Do Preço e Pagamento',
 '3.1. O Locatário(a/e) pagará pelo valor descrito no pedido acima.
3.2. Para garantir a reserva dos itens locados, aceitamos o parcelamento do valor da locação da seguinte forma: Pagamento de 50% (cinquenta por cento) do valor como sinal, realizado por meio de Pix, cartão de crédito ou cartão de débito e os outros 50% (cinquenta por cento) deverá ser quitado no momento da retirada dos itens locados. Caso o cliente prefira, poderá optar pelo pagamento integral (100%) no ato da reserva.
3.3. Os pagamentos feitos via cartão estão sujeitos a taxa conforme o banco PagBank. Cartão de crédito com taxa de 3,14% e cartão de débito com taxa de 0,88%.
3.4. A locação para a data contratada só será garantida mediante o pagamento de 100% do valor do pedido.
3.5. Em caso de cancelamento, será restituído o equivalente a 80% (oitenta por cento) do valor total da locação, a título de reembolso.
3.6. Não serão aceitos pagamentos após o evento ou na devolução de itens locados.'),

(4, '04. Das Avarias de Itens Locados',
 '4.1. O Locador(a/e) se compromete a entregar o produto em bom estado de conservação (salvo desgaste natural da utilização), e o Locatário(a/e), no ato da retirada, confirma e presume o bom estado de conservação.
4.2. No ato da devolução dos bens locados, estes deverão estar no mesmo estado da retirada (sem furos, traços de colagem, cola ou adesivos, marcas de grampeador ou grampos, trincos, arranhões, manchas, quebrados ou peças faltantes), tais como foram recebidos, respondendo o Locatário(a/e) pelos danos causados.
4.3. Após emissão do contrato, a solicitação da troca e/ou exclusão de itens poderá ocorrer no máximo dois dias antes da data do aluguel.'),

(5, '05. Das Multas Contratuais',
 '5.1. No caso de peças com avarias, será cobrado o valor de reposição; em caso de indisponibilidade, será cobrado o valor de mercado.
5.2. No caso de não devolução de peças individuais ou partes, serão cobrados o valor de reposição; em caso de indisponibilidade, será cobrado o valor de mercado.
5.3. No caso de não devolução de itens locados dentro do prazo contratado, será cobrado 1% (um por cento) do valor do contrato por dia de atraso.
5.4. A reforma em itens avariados e/ou compra para reposição de itens advindos dos casos acima citados é exclusiva da Ax Festas, cabendo ao Locatário(a/e) efetuar os devidos pagamentos ora descritos.'),

(6, '06. Disposições Gerais',
 '06.1. As partes declaram estar de acordo com todas as cláusulas deste contrato, comprometendo-se a cumpri-las integralmente.');
