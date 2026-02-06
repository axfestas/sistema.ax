const bcrypt = require('bcryptjs');

async function generateAdminPassword() {
  // ALTERE A SENHA AQUI para a senha que você deseja usar
  // IMPORTANTE: Use uma senha forte com letras maiúsculas, minúsculas, números e símbolos
  const password = 'Admin@2024!Secure';
  
  console.log('\n⚠️  ATENÇÃO: Altere a senha no arquivo scripts/create-admin.js antes de usar!');
  console.log('⚠️  Use uma senha forte com pelo menos 12 caracteres, incluindo:');
  console.log('    - Letras maiúsculas e minúsculas');
  console.log('    - Números');
  console.log('    - Símbolos especiais (!@#$%^&*)\n');
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          CREDENCIAIS DE ADMINISTRADOR                     ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║ Username: admin                                            ║');
  console.log(`║ Password: ${password.padEnd(48, ' ')} ║`);
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║ SENHA HASHEADA (Cole no Airtable campo "password"):       ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(hashedPassword);
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\nPASSOS:');
  console.log('1. Abra seu Airtable Base');
  console.log('2. Abra a tabela "Users"');
  console.log('3. Adicione um novo registro com:');
  console.log('   - username: admin');
  console.log('   - password: [cole a senha hasheada acima]');
  console.log('   - role: admin');
  console.log('4. Configure as variáveis de ambiente no Cloudflare Pages');
  console.log('5. Acesse /login e entre com username "admin" e a senha original\n');
}

generateAdminPassword();
