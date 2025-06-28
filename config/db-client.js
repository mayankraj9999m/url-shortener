import { MongoClient } from "mongodb";

// Validate MongoDB URI format
if (!/^mongodb(?:\+srv)?:\/\/(?!\/).*$/gm.test(process.env.MONGODB_URI)) {
    console.error('❌ MongoDB Connection Error');
    console.error('━'.repeat(80));
    console.error(`🔗 Invalid URI: ${process.env.MONGODB_URI}`);
    console.error('📋 Expected format:');
    console.error('   • mongodb://username:password@host:port/database');
    console.error('   • mongodb+srv://username:password@cluster.mongodb.net/database');
    console.error('━'.repeat(80));
    process.exit(1);
}

export const dbClient = new MongoClient(process.env.MONGODB_URI);