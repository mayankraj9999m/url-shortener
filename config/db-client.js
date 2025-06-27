import { MongoClient, ObjectId } from "mongodb";

export const dbClient = new MongoClient(process.env.MONGODB_URI);
export const ObjId = ObjectId;