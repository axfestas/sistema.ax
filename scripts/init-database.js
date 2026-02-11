#!/usr/bin/env node

/**
 * Script para inicializar o banco de dados D1 de produção
 * 
 * Este script aplica o schema.sql ao banco de dados D1 especificado
 * no wrangler.toml
 * 
 * Uso:
 *   node scripts/init-database.js
 *   npm run db:init
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Ler configuração do wrangler.toml
function getDbConfig() {
  const wranglerPath = path.join(process.cwd(), 'wrangler.toml');
  
  if (!fs.existsSync(wranglerPath)) {
    throw new Error('wrangler.toml not found in current directory');
  }

  const content = fs.readFileSync(wranglerPath, 'utf8');
  
  // Parse simples do TOML para pegar database_name
  const nameMatch = content.match(/database_name\s*=\s*"([^"]+)"/);
  const idMatch = content.match(/database_id\s*=\s*"([^"]+)"/);
  
  if (!nameMatch) {
    throw new Error('database_name not found in wrangler.toml');
  }

  return {
    name: nameMatch[1],
    id: idMatch ? idMatch[1] : 'unknown'
  };
}

// Verificar se wrangler está instalado
function checkWrangler() {
  try {
    execSync('wrangler --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Executar comando wrangler
function runWrangler(command, description) {
  try {
    log(`\nExecuting: ${command}`, 'blue');
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    log(output);
    return { success: true, output };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      output: error.stdout || error.stderr || ''
    };
  }
}

// Verificar se banco existe
function checkDatabase(dbName) {
  logStep('1/4', 'Verificando se banco de dados existe...');
  
  const result = runWrangler('wrangler d1 list', 'List databases');
  
  if (!result.success) {
    logError('Falha ao listar bancos de dados');
    return false;
  }

  if (result.output.includes(dbName)) {
    logSuccess(`Banco de dados "${dbName}" encontrado`);
    return true;
  } else {
    logWarning(`Banco de dados "${dbName}" não encontrado`);
    log(`\nPara criar o banco, execute:`);
    log(`  wrangler d1 create ${dbName}`, 'yellow');
    return false;
  }
}

// Aplicar schema
function applySchema(dbName) {
  logStep('2/4', 'Aplicando schema.sql...');
  
  const schemaPath = path.join(process.cwd(), 'schema.sql');
  
  if (!fs.existsSync(schemaPath)) {
    logError('schema.sql not found');
    return false;
  }

  const result = runWrangler(
    `wrangler d1 execute ${dbName} --file=./schema.sql`,
    'Apply schema'
  );

  if (result.success) {
    logSuccess('Schema aplicado com sucesso');
    return true;
  } else {
    logError('Falha ao aplicar schema');
    log(result.error);
    return false;
  }
}

// Verificar tabelas criadas
function verifyTables(dbName) {
  logStep('3/4', 'Verificando tabelas criadas...');
  
  const result = runWrangler(
    `wrangler d1 execute ${dbName} --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"`,
    'List tables'
  );

  if (!result.success) {
    logError('Falha ao verificar tabelas');
    return false;
  }

  const expectedTables = [
    'users',
    'sessions', 
    'items',
    'reservations',
    'maintenance',
    'financial_records',
    'portfolio_images',
    'site_settings'
  ];

  log('\nTabelas encontradas:', 'cyan');
  log(result.output);

  let allTablesExist = true;
  for (const table of expectedTables) {
    if (result.output.includes(table)) {
      logSuccess(`✓ ${table}`);
    } else {
      logError(`✗ ${table} - FALTANDO`);
      allTablesExist = false;
    }
  }

  return allTablesExist;
}

// Verificar usuário admin
function verifyAdmin(dbName) {
  logStep('4/4', 'Verificando usuário admin padrão...');
  
  const result = runWrangler(
    `wrangler d1 execute ${dbName} --command="SELECT email, name, role FROM users WHERE role='admin';"`,
    'Check admin user'
  );

  if (result.success && result.output.includes('alex.fraga@axfestas.com.br')) {
    logSuccess('Usuário admin criado: alex.fraga@axfestas.com.br');
    log('\n📧 Credenciais padrão:', 'yellow');
    log('   Email: alex.fraga@axfestas.com.br', 'yellow');
    log('   Senha: Ax7866Nb@', 'yellow');
    log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!', 'red');
    return true;
  } else {
    logWarning('Usuário admin não encontrado ou erro ao verificar');
    return false;
  }
}

// Main
async function main() {
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║  Inicialização do Banco de Dados D1 - Sistema Ax      ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝\n', 'cyan');

  try {
    // 1. Verificar wrangler
    if (!checkWrangler()) {
      logError('Wrangler CLI não encontrado');
      log('\nInstale o Wrangler:');
      log('  npm install -g wrangler', 'yellow');
      log('ou');
      log('  npx wrangler', 'yellow');
      process.exit(1);
    }

    // 2. Ler configuração
    const dbConfig = getDbConfig();
    log(`Database Name: ${dbConfig.name}`, 'blue');
    log(`Database ID: ${dbConfig.id}`, 'blue');

    // 3. Verificar banco
    if (!checkDatabase(dbConfig.name)) {
      logError('\nBanco de dados não encontrado. Crie-o primeiro.');
      process.exit(1);
    }

    // 4. Aplicar schema
    if (!applySchema(dbConfig.name)) {
      logError('\nFalha ao aplicar schema');
      process.exit(1);
    }

    // 5. Verificar tabelas
    if (!verifyTables(dbConfig.name)) {
      logWarning('\nAlgumas tabelas não foram criadas corretamente');
      process.exit(1);
    }

    // 6. Verificar admin
    verifyAdmin(dbConfig.name);

    // Sucesso
    log('\n╔════════════════════════════════════════════════════════╗', 'green');
    log('║           ✅ INICIALIZAÇÃO CONCLUÍDA COM SUCESSO!      ║', 'green');
    log('╚════════════════════════════════════════════════════════╝\n', 'green');

    log('Próximos passos:', 'cyan');
    log('1. Testar login em: https://www.axfestas.com.br/login');
    log('2. Usar credenciais: alex.fraga@axfestas.com.br / Ax7866Nb@');
    log('3. Alterar senha imediatamente após login!');
    log('4. Configurar dados da empresa no painel admin\n');

  } catch (error) {
    logError(`\nErro: ${error.message}`);
    process.exit(1);
  }
}

main();
