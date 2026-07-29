const { MongoClient } = require("mongodb");

const mongoUri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

let db;

const connectDB = async () => {
    try {

        const client = new MongoClient(mongoUri);

        await client.connect();

        db = client.db(dbName);

        console.log("Connected to MongoDB:", dbName);
        console.log("MongoDB Connected Successfully");

    } catch (error) {

        console.error("MongoDB Connection Failed");
        console.error(error.message);
        process.exit(1);

    }
};

// Return the connected database instance
const getDB = () => {

    if (!db) {
        throw new Error("Database not connected. Call connectDB() first.");
    }

    return db;
};

module.exports = {
    connectDB,
    getDB
};