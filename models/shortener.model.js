import { dbClient } from "../config/db-client.js";

const db = dbClient.db(process.env.MONGODB_DATABASE_NAME);
const shortColn = db.collection('shortLinks');

export const loadLinks = async () => {
    const res = await shortColn.find().toArray();
    if (res.length === 0) {
        await shortColn.insertOne({});
        return {};
    }
    delete res[0]._id;
    return res[0];
}

export const saveLinks = async (shortCode, url) => {
    try {
        await shortColn.updateOne({}, { $set: { [shortCode]: url } });
        console.log(`URL Short code : ${shortCode} created.`);
    } catch (error) {
        console.log(error);
    }
}

export const deleteLinks = async (shortCode) => {
    try {
        const del_res = await shortColn.updateOne({}, {$unset : {[shortCode] : 1}});
        if (del_res.modifiedCount)
            return true;
        throw new Error("Delete Error : short code not found")
    } catch (error) {
        console.error(error);
        return false;
    }
}

export const Devs = [
    {
        Name: "Mayank Raj",
        Skills: "Node.js/ Express.js"
    },
];