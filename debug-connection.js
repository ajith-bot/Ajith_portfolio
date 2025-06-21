require('dotenv').config();

const uri = process.env.MONGODB_URI;

console.log('🔍 Debugging Connection String:');
console.log('Full URI:', uri);

// Parse the URI
try {
    const url = new URL(uri);
    console.log('\n📋 Parsed Components:');
    console.log('Protocol:', url.protocol);
    console.log('Username:', url.username);
    console.log('Password:', url.password ? '****' : 'MISSING!');
    console.log('Hostname:', url.hostname);
    console.log('Database:', url.pathname.slice(1));
    console.log('Search params:', url.search);
    
    if (!url.username) console.log('❌ Username is missing!');
    if (!url.password) console.log('❌ Password is missing!');
    if (!url.hostname) console.log('❌ Hostname is missing!');
    
} catch (error) {
    console.error('❌ Invalid URI format:', error.message);
}