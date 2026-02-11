#!/usr/bin/env node

/**
 * Script para criar o primeiro admin usando a API /api/auth/create-first-admin
 * 
 * Este script facilita a criação do primeiro admin via API em vez de SQL direto.
 * 
 * Uso:
 * 1. Configure FIRST_ADMIN_SECRET no Cloudflare Pages (variável de ambiente)
 * 2. Execute este script:
 *    node scripts/setup-admin-with-api.js
 * 
 * Ou passe os parâmetros diretamente:
 *    node scripts/setup-admin-with-api.js <URL_DO_SITE> <SECRET> <PASSWORD> [EMAIL] [NAME]
 */

const https = require('https');
const http = require('http');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createFirstAdmin(siteUrl, secret, password, email = 'alex.fraga@axfestas.com.br', name = 'Alex Fraga') {
  // Remover trailing slash se houver
  const baseUrl = siteUrl.replace(/\/$/, '');
  const url = new URL(`${baseUrl}/api/auth/create-first-admin`);
  
  const data = JSON.stringify({
    email,
    password,
    name,
    secret
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const protocol = url.protocol === 'https:' ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, response });
        } catch (e) {
          resolve({ status: res.statusCode, response: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  🔐 Criar Primeiro Admin via API                              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  let siteUrl, secret, password, email, name;

  // Verificar se os parâmetros foram passados via linha de comando
  if (process.argv.length >= 5) {
    [, , siteUrl, secret, password, email, name] = process.argv;
    
    if (!email) email = 'alex.fraga@axfestas.com.br';
    if (!name) name = 'Alex Fraga';
    
    console.log('📝 Usando parâmetros da linha de comando\n');
  } else {
    console.log('📝 Modo interativo - Digite as informações:\n');
    
    siteUrl = await question('🌐 URL do site (ex: https://sistema-ax.pages.dev): ');
    if (!siteUrl) {
      console.error('❌ URL do site é obrigatória!');
      rl.close();
      process.exit(1);
    }

    secret = await question('🔑 Chave secreta (FIRST_ADMIN_SECRET): ');
    if (!secret) {
      console.error('❌ Chave secreta é obrigatória!');
      rl.close();
      process.exit(1);
    }

    password = await question('🔒 Senha do admin: ');
    if (!password) {
      console.error('❌ Senha é obrigatória!');
      rl.close();
      process.exit(1);
    }

    email = await question('📧 Email do admin [alex.fraga@axfestas.com.br]: ');
    if (!email) email = 'alex.fraga@axfestas.com.br';

    name = await question('👤 Nome do admin [Alex Fraga]: ');
    if (!name) name = 'Alex Fraga';
  }

  rl.close();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Resumo:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('URL:   ', siteUrl);
  console.log('Email: ', email);
  console.log('Nome:  ', name);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('⏳ Criando admin...\n');

  try {
    const result = await createFirstAdmin(siteUrl, secret, password, email, name);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📡 Status HTTP: ${result.status}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (result.status === 201) {
      console.log('✅ SUCESSO! Admin criado com sucesso!\n');
      console.log('Resposta da API:');
      console.log(JSON.stringify(result.response, null, 2));
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 Próximos passos:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`1. Acesse: ${siteUrl}/login`);
      console.log(`2. Email: ${email}`);
      console.log('3. Senha: A senha que você definiu');
      console.log('4. Você será redirecionado para /admin como administrador!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else if (result.status === 400 && result.response.error && result.response.error.includes('already exists')) {
      console.log('⚠️  Já existe um admin no sistema!\n');
      console.log('Resposta da API:');
      console.log(JSON.stringify(result.response, null, 2));
      console.log('\n💡 Dica: Se você esqueceu a senha do admin, use:');
      console.log('   node scripts/generate-password-hash.js "nova_senha"');
      console.log('   E atualize manualmente no banco D1.\n');
    } else {
      console.log('❌ Erro ao criar admin!\n');
      console.log('Resposta da API:');
      console.log(JSON.stringify(result.response, null, 2));
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('💡 Possíveis causas:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('1. Chave secreta incorreta');
      console.log('2. FIRST_ADMIN_SECRET não configurada no Cloudflare Pages');
      console.log('3. Já existe um admin (use o método de reset de senha)');
      console.log('4. Erro de rede ou URL incorreta');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }
  } catch (error) {
    console.error('\n❌ Erro de conexão:', error.message);
    console.log('\n💡 Verifique:');
    console.log('  - A URL está correta e acessível');
    console.log('  - Você está conectado à internet');
    console.log('  - O site está funcionando (não está em manutenção)');
    console.log('');
  }
}

main();
