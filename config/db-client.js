import mongoose from "mongoose";
import { env } from "./env.js";

const {
    MONGODB_USERNAME,
    MONGODB_PASSWORD,
    MONGODB_CLUSTER,
    MONGODB_DATABASE,
    MONGODB_OPTIONS
} = env;

const encodedPassword = encodeURIComponent(MONGODB_PASSWORD);

const uri = `mongodb+srv://${MONGODB_USERNAME}:${encodedPassword}@${MONGODB_CLUSTER}/${MONGODB_DATABASE}${MONGODB_OPTIONS}`;

try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected successfully");
} catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
}