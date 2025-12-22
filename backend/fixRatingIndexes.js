const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config();

async function fixIndexes() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_CONN);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('ratings');

        // List current indexes
        console.log('\n📋 Current indexes:');
        const indexes = await collection.indexes();
        indexes.forEach(idx => {
            console.log(`  - ${idx.name}:`, idx.key);
        });

        // Drop ALL indexes except _id
        console.log('\n🗑️ Dropping all custom indexes...');
        await collection.dropIndexes();
        console.log('✅ All custom indexes dropped');

        // Create the correct unique index
        console.log('\n📝 Creating correct unique index...');
        await collection.createIndex(
            { clientId: 1, freelancerId: 1 },
            { unique: true, name: 'clientId_1_freelancerId_1' }
        );
        console.log('✅ Created unique index: clientId_1_freelancerId_1');

        // Create performance index
        await collection.createIndex(
            { freelancerId: 1, createdAt: -1 },
            { name: 'freelancerId_1_createdAt_-1' }
        );
        console.log('✅ Created performance index: freelancerId_1_createdAt_-1');

        console.log('\n✨ Database fixed successfully!');
        console.log('🔄 Please restart your server now.');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

fixIndexes();
