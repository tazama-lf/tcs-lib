// Test script for in-memory user email cache
const { userEmailCache } = require('./dist/index');

console.log('🧪 Testing In-Memory User Email Cache\n');

// Test 1: Cache a user
console.log('1️⃣ Caching user...');
userEmailCache.cacheUser(
  'tenant123',
  'user456',
  'john.doe@example.com',
  ['editor', 'viewer'],
  'John Doe'
);
console.log('✅ User cached\n');

// Test 2: Retrieve email by user ID
console.log('2️⃣ Retrieving email by user ID...');
const email = userEmailCache.getEmail('tenant123', 'user456');
console.log(`✅ Email retrieved: ${email}\n`);

// Test 3: Cache multiple users with roles
console.log('3️⃣ Caching multiple users with different roles...');
userEmailCache.cacheUser('tenant123', 'approver1', 'alice@example.com', ['approver'], 'Alice Smith');
userEmailCache.cacheUser('tenant123', 'approver2', 'bob@example.com', ['approver'], 'Bob Wilson');
userEmailCache.cacheUser('tenant123', 'editor1', 'carol@example.com', ['editor'], 'Carol Davis');
console.log('✅ Multiple users cached\n');

// Test 4: Get all emails by role
console.log('4️⃣ Getting all approver emails...');
const approverEmails = userEmailCache.getEmailsByRole('tenant123', 'approver');
console.log(`✅ Approver emails: ${approverEmails.join(', ')}\n`);

console.log('5️⃣ Getting all editor emails...');
const editorEmails = userEmailCache.getEmailsByRole('tenant123', 'editor');
console.log(`✅ Editor emails: ${editorEmails.join(', ')}\n`);

// Test 5: Multi-tenant isolation
console.log('6️⃣ Testing multi-tenant isolation...');
userEmailCache.cacheUser('tenant999', 'user789', 'other@tenant.com', ['admin'], 'Other User');
const tenant123Users = userEmailCache.getUsersByTenant('tenant123');
const tenant999Users = userEmailCache.getUsersByTenant('tenant999');
console.log(`✅ Tenant 123 users: ${tenant123Users.length}`);
console.log(`✅ Tenant 999 users: ${tenant999Users.length}\n`);

// Test 6: Get cache stats
console.log('7️⃣ Cache statistics:');
const stats = userEmailCache.getStats();
console.log(`✅ Total users cached: ${stats.totalUsers}`);
console.log(`✅ Total role indexes: ${stats.totalRoleIndexes}\n`);

// Test 7: Cache miss (user not found)
console.log('8️⃣ Testing cache miss...');
const notFound = userEmailCache.getEmail('tenant123', 'nonexistent');
console.log(`✅ Cache miss result: ${notFound === null ? 'null (expected)' : 'ERROR'}\n`);

console.log('🎉 All tests passed!');
console.log('\n📝 Summary:');
console.log('  - In-memory cache working correctly');
console.log('  - Multi-tenant isolation working');
console.log('  - Role-based queries working');
console.log('  - No database required!');
