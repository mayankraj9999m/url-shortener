import { dbClient } from "../config/db-client.js";

const db = dbClient.db(process.env.MONGODB_DATABASE_NAME);
const shortColn = db.collection('shortLinks');

export const loadLinks = async (query) => {
    const res = await shortColn.find(query).toArray();
    if (res.length === 0) {
        return [];
    }
    return res;
}

export const saveLinks = async (shortCode, url) => {
    try {
        await shortColn.insertOne({shortCode, url});
        console.log(`URL Short code : ${shortCode} created.`);
    } catch (error) {
        console.log(error);
    }
}

export const deleteLinks = async (shortCode) => {
    try {
        // const del_res = await shortColn.updateOne({}, {$unset : {[shortCode] : 1}});
        const del_res = await shortColn.deleteOne({shortCode});
        if (del_res.deletedCount)
            return true;
        throw new Error("Delete Error : short code not found");
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