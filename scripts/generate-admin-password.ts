// scripts/generate-admin-password.ts
const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = process.argv[2] || '123,Craigbes';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('\n🔐 Admin Password Hash Generator\n');
  console.log('Password:', password);
  console.log('\nGenerated Hash:');
  console.log(hash);
  console.log('\n📋 Add this to your .env file:');
  console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
  console.log('\n');
}

generateHash();

// Default password (123,Craigbes)
// node scripts/generate-admin-password.ts

// Custom password
// node scripts/generate-admin-password.ts YourSecurePassword123

// or use Node directly
// node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('123,Craigbes', 10, (err, hash) => { console.log('\nADMIN_PASSWORD_HASH=\"' + hash + '\"'); });"
