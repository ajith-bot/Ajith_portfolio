require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
    try {
        console.log('🔄 Testing MongoDB Atlas connection...');
        console.log('📍 URI:', process.env.MONGODB_URI.replace(/:[^:@]*@/, ':****@'));
        
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ Successfully connected to MongoDB Atlas!');
        
        // Test database operations
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        
        console.log('\n📊 Database Information:');
        console.log(`Database Name: ${db.databaseName}`);
        console.log(`Collections: ${collections.length}`);
        
        if (collections.length > 0) {
            console.log('\n📋 Collections:');
            collections.forEach(collection => {
                console.log(`- ${collection.name}`);
            });
        }
        
        // Test a simple query
        const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }));
        const projectCount = await Project.countDocuments();
        console.log(`\n📈 Total Projects: ${projectCount}`);
        
        if (projectCount > 0) {
            const latestProject = await Project.findOne().sort({ createdAt: -1 });
            console.log(`📌 Latest Project: ${latestProject?.title || 'N/A'}`);
        }
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        
        if (error.message.includes('authentication failed')) {
            console.log('\n💡 Troubleshooting Tips:');
            console.log('1. Check your username and password');
            console.log('2. Ensure the database user has proper permissions');
            console.log('3. Verify the database name in the connection string');
        }
        
        if (error.message.includes('IP address')) {
            console.log('\n💡 Network Issue:');
            console.log('1. Add your IP address to MongoDB Atlas Network Access');
            console.log('2. Or allow access from anywhere (0.0.0.0/0)');
        }
        
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Connection closed');
        process.exit(0);
    }
}

testConnection();