import {and, eq} from "drizzle-orm";
import {db} from "../config/db.js";
import {short_link} from "../drizzle/schema.js";

export const loadLinks = async (userId, shortCode = null) => {
    let res;

    if (shortCode) {
        res = await db.select().from(short_link).where(
            and(
                eq(short_link.shortCode, shortCode),
                eq(short_link.userId, userId)
            )
        );
    } else {
        res = await db.select().from(short_link).where(eq(short_link.userId, userId));
    }

    return res?.length ? res : [];
};

export const saveLinks = async (shortCode, url, userId) => {
    try {
        await db.insert(short_link).values({
            url, shortCode, userId
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

export const editShortLinkDatabase = async (id, url, shortCode, userId) => {
    return (await db.update(short_link)
        .set({url: url, shortCode: shortCode})
        .where(and(
                eq(short_link.id, id),
                eq(short_link.userId, userId)
            )
        )
    )
};