/**
 * POST /api/contracts/open-word
 *
 * Gera um arquivo .docx do contrato, faz upload para o OneDrive via Microsoft
 * Graph API e retorna o link de edição no Word Online.
 *
 * Variáveis de ambiente necessárias (configurar no Cloudflare Dashboard > Settings > Variables):
 *   MS_CLIENT_ID      — ID do aplicativo registrado no Azure
 *   MS_CLIENT_SECRET  — Segredo do aplicativo (marcar como secret/encrypted)
 *   MS_TENANT_ID      — ID do tenant Azure (ou "common" para multi-tenant)
 *   MS_ONEDRIVE_USER  — UPN ou ID do usuário cujo OneDrive será usado (ex: admin@suaempresa.com)
 *
 * Body: { contractId: number }
 * Response: { url: string }
 */

import { requireAdmin } from '../../../src/lib/auth';

interface Env {
  DB: D1Database;
  MS_CLIENT_ID?: string;
  MS_CLIENT_SECRET?: string;
  MS_TENANT_ID?: string;
  MS_ONEDRIVE_USER?: string;
}

interface ContractRow {
  id: number;
  client_name: string;
  client_phone: string;
  client_email?: string;
  client_cpf?: string;
  client_address?: string;
  client_city?: string;
  client_state?: string;
  event_date?: string;
  event_location?: string;
  pickup_date?: string;
  return_date?: string;
  items_json: string;
  discount: number;
  total: number;
  payment_method?: string;
  notes?: string;
}

interface ContractItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface DriveItem {
  id: string;
}

interface SharingLink {
  webUrl: string;
}

interface CreateLinkResponse {
  link: SharingLink;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function jsonErr(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: JSON_HEADERS });
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function fmtDate(iso?: string) {
  if (!iso) return '';
  try { return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR'); } catch { return iso; }
}

function escXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ─── DOCX generator ───────────────────────────────────────────────────────────

/** Builds OOXML word/document.xml content for the given contract. */
function buildDocumentXml(ct: ContractRow): string {
  let items: ContractItem[] = [];
  try { items = JSON.parse(ct.items_json) as ContractItem[]; } catch { /* ignore */ }

  const PAYMENT_MAP: Record<string, string> = {
    pix: 'Pix',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
    dinheiro: 'Dinheiro',
    transferencia: 'Transferência Bancária',
    boleto: 'Boleto',
  };
  const paymentLabel = ct.payment_method ? (PAYMENT_MAP[ct.payment_method] ?? ct.payment_method) : '';

  const subtotal = items.reduce((s, i) => s + i.total, 0);

  const p = (text: string, bold = false, fontSize = 24, center = false, color?: string) => {
    const runProps = [
      bold ? '<w:b/>' : '',
      `<w:sz w:val="${fontSize}"/>`,
      color ? `<w:color w:val="${color}"/>` : '',
    ].join('');
    const paraProps = center ? '<w:pPr><w:jc w:val="center"/></w:pPr>' : '';
    return `<w:p>${paraProps}<w:r><w:rPr>${runProps}</w:rPr><w:t xml:space="preserve">${escXml(text)}</w:t></w:r></w:p>`;
  };

  const row = (...cells: string[]) => {
    const tcs = cells.map((c, i) => {
      const width = i === 0 ? 1800 : i === 1 ? 800 : i === 2 ? 1800 : 1800;
      return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">${escXml(c)}</w:t></w:r></w:p></w:tc>`;
    }).join('');
    return `<w:tr>${tcs}</w:tr>`;
  };

  const headerRow = (...cells: string[]) => {
    const tcs = cells.map((c, i) => {
      const width = i === 0 ? 1800 : i === 1 ? 800 : i === 2 ? 1800 : 1800;
      return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="F0F0F0"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">${escXml(c)}</w:t></w:r></w:p></w:tc>`;
    }).join('');
    return `<w:tr>${tcs}</w:tr>`;
  };

  const itemRows = items.map((it, idx) =>
    row(it.description, String(it.quantity), BRL(it.unit_price), BRL(it.total))
  ).join('');

  const emptyPara = '<w:p/>';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${p('AX FESTAS', true, 32, true)}
    ${p('CONTRATO DE LOCAÇÃO', true, 28, true)}
    ${emptyPara}
    ${p('LOCADOR(A/E)', true, 22)}
    ${p(`Nome: ${ct.client_name}`, false, 22)}
    ${p(`Telefone: ${ct.client_phone}`, false, 22)}
    ${ct.client_email ? p(`E-mail: ${ct.client_email}`, false, 22) : ''}
    ${ct.client_cpf ? p(`CPF/CNPJ: ${ct.client_cpf}`, false, 22) : ''}
    ${ct.client_address ? p(`Endereço: ${ct.client_address}${ct.client_city ? ', ' + ct.client_city : ''}${ct.client_state ? ' - ' + ct.client_state : ''}`, false, 22) : ''}
    ${emptyPara}
    ${ct.event_date || ct.pickup_date || ct.return_date ? p('DATAS', true, 22) : ''}
    ${ct.event_date ? p(`Data do Evento: ${fmtDate(ct.event_date)}`, false, 22) : ''}
    ${ct.event_location ? p(`Local do Evento: ${ct.event_location}`, false, 22) : ''}
    ${ct.pickup_date ? p(`Data de Retirada: ${fmtDate(ct.pickup_date)}`, false, 22) : ''}
    ${ct.return_date ? p(`Data de Devolução: ${fmtDate(ct.return_date)}`, false, 22) : ''}
    ${emptyPara}
    ${p('ITENS LOCADOS', true, 22)}
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="6200" w:type="dxa"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
          <w:left w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
          <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
          <w:right w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
        </w:tblBorders>
      </w:tblPr>
      ${headerRow('Descrição', 'Qtd', 'Valor Unit.', 'Total')}
      ${itemRows}
    </w:tbl>
    ${emptyPara}
    ${ct.discount > 0 ? p(`Desconto: - ${BRL(ct.discount)}`, false, 22) : ''}
    ${p(`Total: ${BRL(ct.total)}`, true, 24)}
    ${paymentLabel ? p(`Forma de Pagamento: ${paymentLabel}`, false, 22) : ''}
    ${ct.notes ? `${emptyPara}${p('OBSERVAÇÕES', true, 22)}${p(ct.notes, false, 22)}` : ''}
    ${emptyPara}
    ${p('CLÁUSULAS DO CONTRATO', true, 22)}
    ${emptyPara}
    ${p('Cl. 01 — Do Objeto da Locação', true, 22)}
    ${p('A locadora Ax Festas disponibiliza a locação de mobiliário e objetos destinados à realização de festas e eventos em geral.', false, 22)}
    ${emptyPara}
    ${p('Cl. 02 — Das Retiradas e Devoluções', true, 22)}
    ${p('As retiradas e devoluções dos itens locados deverão ser realizadas com 24h de antecedência ou na data do evento.', false, 22)}
    ${emptyPara}
    ${p('Cl. 03 — Do Preço e Pagamento', true, 22)}
    ${p('O Locatário(a/e) pagará pelo valor descrito no pedido acima conforme forma de pagamento acordada.', false, 22)}
    ${emptyPara}
    ${p('Cl. 04 — Das Avarias de Itens Locados', true, 22)}
    ${p('O Locador(a/e) se compromete a entregar o produto em bom estado de conservação e o Locatário(a/e) responde pelos danos causados.', false, 22)}
    ${emptyPara}
    ${p('Cl. 05 — Das Multas Contratuais', true, 22)}
    ${p('No caso de peças com avarias, será cobrado o valor de reposição. No caso de não devolução, será cobrado 1% ao dia de atraso.', false, 22)}
    ${emptyPara}
    ${p('Cl. 06 — Disposições Gerais', true, 22)}
    ${p('As partes declaram estar de acordo com todas as cláusulas deste contrato, comprometendo-se a cumpri-las integralmente.', false, 22)}
    ${emptyPara}
    ${emptyPara}
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9000" w:type="dxa"/>
        <w:tblBorders>
          <w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/>
          <w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        <w:tc>
          <w:tcPr><w:tcW w:w="4000" w:type="dxa"/></w:tcPr>
          <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>_______________________________</w:t></w:r></w:p>
          <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>Locador(a/e)</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="4000" w:type="dxa"/></w:tcPr>
          <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>_______________________________</w:t></w:r></w:p>
          <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">Locatário(a/e): ${escXml(ct.client_name)}</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
    </w:tbl>
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

// ─── Minimal ZIP creator (no compression – stored entries) ───────────────────

function uint16LE(n: number): Uint8Array {
  return new Uint8Array([n & 0xff, (n >> 8) & 0xff]);
}

function uint32LE(n: number): Uint8Array {
  return new Uint8Array([n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff]);
}

function crc32(data: Uint8Array): number {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) { out.set(a, offset); offset += a.length; }
  return out;
}

interface ZipEntry { name: string; data: Uint8Array }

function createDocx(entries: ZipEntry[]): Uint8Array {
  const enc = new TextEncoder();
  const localBlocks: Uint8Array[] = [];
  const centralEntries: { header: Uint8Array; offset: number }[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = enc.encode(entry.name);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    const localHeader = concatBytes(
      new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
      uint16LE(20), uint16LE(0), uint16LE(0),
      uint16LE(0), uint16LE(0),
      uint32LE(crc), uint32LE(size), uint32LE(size),
      uint16LE(nameBytes.length), uint16LE(0),
      nameBytes,
    );

    const centralHeader = concatBytes(
      new Uint8Array([0x50, 0x4b, 0x01, 0x02]),
      uint16LE(20), uint16LE(20), uint16LE(0), uint16LE(0),
      uint16LE(0), uint16LE(0),
      uint32LE(crc), uint32LE(size), uint32LE(size),
      uint16LE(nameBytes.length), uint16LE(0), uint16LE(0),
      uint16LE(0), uint16LE(0),
      uint32LE(0),
      uint32LE(offset),
      nameBytes,
    );

    localBlocks.push(localHeader, entry.data);
    centralEntries.push({ header: centralHeader, offset });
    offset += localHeader.length + size;
  }

  const centralDirBytes = concatBytes(...centralEntries.map(e => e.header));
  const eocd = concatBytes(
    new Uint8Array([0x50, 0x4b, 0x05, 0x06]),
    uint16LE(0), uint16LE(0),
    uint16LE(entries.length), uint16LE(entries.length),
    uint32LE(centralDirBytes.length), uint32LE(offset),
    uint16LE(0),
  );

  return concatBytes(...localBlocks, centralDirBytes, eocd);
}

// ─── Build DOCX bytes ─────────────────────────────────────────────────────────

const enc = new TextEncoder();

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const WORD_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;

function buildDocx(ct: ContractRow): Uint8Array {
  const documentXml = buildDocumentXml(ct);
  return createDocx([
    { name: '[Content_Types].xml', data: enc.encode(CONTENT_TYPES) },
    { name: '_rels/.rels', data: enc.encode(RELS) },
    { name: 'word/_rels/document.xml.rels', data: enc.encode(WORD_RELS) },
    { name: 'word/document.xml', data: enc.encode(documentXml) },
  ]);
}

// ─── Microsoft Graph API helpers ─────────────────────────────────────────────

async function getMsToken(clientId: string, clientSecret: string, tenantId: string): Promise<string> {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Erro ao obter token Microsoft: ${err}`);
  }

  const data = await res.json() as { access_token: string };
  return data.access_token;
}

async function uploadToOneDrive(
  token: string,
  userId: string,
  filename: string,
  docxBytes: Uint8Array,
): Promise<DriveItem> {
  const path = encodeURIComponent(`Axfestas/Contratos/${filename}`);
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${userId}/drive/root:/${path}:/content`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
      body: docxBytes.buffer.slice(docxBytes.byteOffset, docxBytes.byteOffset + docxBytes.byteLength) as ArrayBuffer,
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Erro ao enviar para OneDrive: ${err}`);
  }

  return res.json() as Promise<DriveItem>;
}

async function createEditLink(token: string, userId: string, itemId: string): Promise<string> {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${userId}/drive/items/${itemId}/createLink`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'edit', scope: 'organization' }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Erro ao criar link de edição: ${err}`);
  }

  const data = await res.json() as CreateLinkResponse;
  return data.link.webUrl;
}

// ─── Request handler ──────────────────────────────────────────────────────────

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.env.DB, context.request);
  } catch {
    return jsonErr('Não autorizado', 401);
  }

  const { MS_CLIENT_ID, MS_CLIENT_SECRET, MS_TENANT_ID, MS_ONEDRIVE_USER } = context.env;

  if (!MS_CLIENT_ID || !MS_CLIENT_SECRET || !MS_TENANT_ID || !MS_ONEDRIVE_USER) {
    return jsonErr(
      'Integração com Word Online não configurada. Configure as variáveis MS_CLIENT_ID, MS_CLIENT_SECRET, MS_TENANT_ID e MS_ONEDRIVE_USER no painel do Cloudflare.',
      503,
    );
  }

  let contractId: number;
  try {
    const body = await context.request.json() as { contractId?: unknown };
    contractId = Number(body.contractId);
    if (!contractId || isNaN(contractId)) throw new Error('contractId inválido');
  } catch {
    return jsonErr('Body inválido. Envie { contractId: number }');
  }

  const row = await context.env.DB
    .prepare('SELECT * FROM contracts WHERE id = ?')
    .bind(contractId)
    .first() as ContractRow | null;

  if (!row) return jsonErr('Contrato não encontrado', 404);

  try {
    const docxBytes = buildDocx(row);
    const token = await getMsToken(MS_CLIENT_ID, MS_CLIENT_SECRET, MS_TENANT_ID);
    const safeName = row.client_name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .slice(0, 40);
    const filename = `Contrato-${String(row.id).padStart(5, '0')}-${safeName || 'cliente'}.docx`;
    const item = await uploadToOneDrive(token, MS_ONEDRIVE_USER, filename, docxBytes);
    const url = await createEditLink(token, MS_ONEDRIVE_USER, item.id);

    return new Response(JSON.stringify({ url }), { status: 200, headers: JSON_HEADERS });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonErr(`Erro ao gerar documento Word: ${message}`, 500);
  }
};
