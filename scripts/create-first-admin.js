#!/usr/bin/env node

/**
 * Script para criar o primeiro usuário admin
 * Uso: node scripts/create-first-admin.js
 */

const crypto = require('crypto');
const readline = require('readline');
const { spawn } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createFirstAdmin() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 Criar Primeiro Usuário Admin');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Informações do admin
  const email = 'alex.fraga@axfestas.com.br';
  const name = 'Alex Fraga';
  
  console.log(`📧 Email: ${email}`);
  console.log(`👤 Nome:  ${name}`);
  console.log(`🔑 Role:  admin\n`);

  // Perguntar senha
  const password = await question('Digite a senha para o admin (min. 6 caracteres): ');
  
  if (!password || password.length < 6) {
    console.error('\n❌ Erro: A senha deve ter no mínimo 6 caracteres!\n');
    rl.close();
    process.exit(1);
  }

  const confirmPassword = await question('Confirme a senha: ');
  
  if (password !== confirmPassword) {
    console.error('\n❌ Erro: As senhas não coincidem!\n');
    rl.close();
    process.exit(1);
  }

  // Gerar hash
  console.log('\n⏳ Gerando hash da senha...');
  const { hash, salt } = hashPassword(password);
  const passwordHash = `${salt}:${hash}`;

  console.log('✅ Hash gerado!\n');

  // Perguntar nome do banco
  const dbName = await question('Nome do banco D1 (pressione Enter para "sistema-ax-festas"): ') || 'sistema-ax-festas';

  // Montar comando SQL
  const sql = `INSERT INTO users (email, password_hash, name, role) VALUES ('${email}', '${passwordHash}', '${name}', 'admin');`;

  console.log('\n⏳ Criando usuário admin no banco...\n');
  console.log(`Executando: wrangler d1 execute ${dbName} --command="..."\n`);

  // Executar via wrangler
  const wrangler = spawn('wrangler', [
    'd1',
    'execute',
    dbName,
    `--command=${sql}`
  ]);

  let output = '';
  let errorOutput = '';

  wrangler.stdout.on('data', (data) => {
    output += data.toString();
    process.stdout.write(data);
  });

  wrangler.stderr.on('data', (data) => {
    errorOutput += data.toString();
    process.stderr.write(data);
  });

  wrangler.on('close', (code) => {
    rl.close();
    
    if (code === 0) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Admin criado com sucesso!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('📝 Dados de Login:\n');
      console.log(`   Email: ${email}`);
      console.log(`   Senha: [a senha que você digitou]`);
      console.log(`\n🚀 Acesse: /login\n`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else {
      console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ Erro ao criar admin');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      if (errorOutput.includes('UNIQUE constraint failed')) {
        console.error('⚠️  O usuário já existe no banco!\n');
        console.error('Para deletar e recriar, execute:\n');
        console.error(`wrangler d1 execute ${dbName} --command="DELETE FROM users WHERE email = '${email}';"\n`);
      } else if (errorOutput.includes('no such table')) {
        console.error('⚠️  A tabela users não existe!\n');
        console.error('Execute o schema primeiro:\n');
        console.error(`wrangler d1 execute ${dbName} --file=./schema.sql\n`);
      } else {
        console.error('Erro:', errorOutput || output || 'Erro desconhecido');
      }
      
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
  });
}

// Verificar se wrangler está instalado
const checkWrangler = spawn('wrangler', ['--version']);

checkWrangler.on('error', () => {
  console.error('❌ Erro: Wrangler CLI não está instalado!\n');
  console.error('Instale com: npm install -g wrangler\n');
  process.exit(1);
});

checkWrangler.on('close', (code) => {
  if (code === 0) {
    createFirstAdmin();
  }
});
