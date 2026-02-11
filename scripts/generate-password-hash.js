#!/usr/bin/env node

/**
 * Script para gerar hash de senha para usuários
 * Uso: node scripts/generate-password-hash.js "sua_senha"
 */

const crypto = require('crypto');

function hashPassword(password, salt) {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }

  const hash = crypto
    .createHash('sha256')
    .update(password + salt)
    .digest('hex');

  return { hash, salt };
}

// Pegar senha do argumento
const password = process.argv[2];

if (!password) {
  console.error('❌ Erro: Forneça uma senha!');
  console.log('\nUso: node scripts/generate-password-hash.js "sua_senha"\n');
  process.exit(1);
}

if (password.length < 6) {
  console.error('❌ Erro: A senha deve ter no mínimo 6 caracteres!');
  process.exit(1);
}

// Gerar hash
const { hash, salt } = hashPassword(password);
const passwordHash = `${salt}:${hash}`;

console.log('\n✅ Hash gerado com sucesso!\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Salt:          ', salt);
console.log('Hash:          ', hash);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\n📋 Use este Password Hash no SQL:\n');
console.log(`'${passwordHash}'`);
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('🔐 Exemplo de comando SQL:\n');
console.log(`INSERT INTO users (email, password_hash, name, role)`);
console.log(`VALUES (`);
console.log(`  'alex.fraga@axfestas.com.br',`);
console.log(`  '${passwordHash}',`);
console.log(`  'Alex Fraga',`);
console.log(`  'admin'`);
console.log(`);\n`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📝 Via Wrangler CLI:\n');
console.log(`wrangler d1 execute sistema-ax-festas --command="INSERT INTO users (email, password_hash, name, role) VALUES ('alex.fraga@axfestas.com.br', '${passwordHash}', 'Alex Fraga', 'admin');"`);
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
