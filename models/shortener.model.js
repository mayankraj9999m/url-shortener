import { eq } from "drizzle-orm";
import { db } from "../config/db.js";
import { short_link } from "../drizzle/schema.js";

export const loadLinks = async (shortCode = null) => {
    let res;
    (!shortCode) ? res = await db.select().from(short_link) : res = await db.select().from(short_link).where(eq(short_link.shortCode, shortCode));
    if (!res || res.length === 0) {
        return [];
    }
    return res;
};

export const saveLinks = async (shortCode, url) => {
    try {
        await db.insert(short_link).values({
            url, shortCode
        })
        console.log(`URL Short code : ${shortCode} created.`);
    } catch (error) {
        console.log(error);
    }
};

export const deleteLinks = async (shortCode) => {
    try {
        const [del_res] = await db.delete(short_link).where(eq(short_link.shortCode, shortCode));
        if (del_res.affectedRows > 0)
            return true;
        throw new Error("Delete Error : short code not found");
    } catch (error) {
        console.error(error);
        return false;
    }
};

export const Devs = [
    {
        Name: "Mayank Raj",
        Skills: "Node.js/ Express.js"
    },
];