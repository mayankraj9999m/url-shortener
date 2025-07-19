import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../config/db.js";
import { short_link } from "../drizzle/schema.js";
import { logoutUser } from "../controllers/auth.controller.js";

export const loadLinks = async ({ userId, shortCode = null, limit = 10, offset = 0 }) => {
    let res;
    let totalCount;

    try {
        if (shortCode) {
            res = await db.select().from(short_link).where(
                and(
                    eq(short_link.shortCode, shortCode),
                    eq(short_link.userId, userId)
                )
            );
            totalCount = 1;
        } else {
            const condition = eq(short_link.userId, userId);
            res = await db.select().from(short_link).where(condition).orderBy(desc(short_link.createdAt)).limit(limit).offset(offset);

            [{ totalCount }] = await db.select({ totalCount: count() }).from(short_link).where(condition);
        }
    } catch {
        await logoutUser();
    }
    return res?.length ? { shortLinks: res, totalCount } : { shortLinks: [], totalCount: 0 };
};

export const saveLinks = async (shortCode, url, userId) => {
    try {
        await db.insert(short_link).values({
            url, shortCode, userId
        })
        console.log(`URL Short code : ${shortCode} created.`);
    } catch (error) {
        console.log(error);
        await logoutUser();
    }
};

export const deleteLinks = async (shortCode, userId) => {
    try {
        const [del_res] = await db.delete(short_link).where(
            and(
                eq(short_link.shortCode, shortCode),
                eq(short_link.userId, userId)
            )
        );
        return del_res.affectedRows > 0;
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
    return (db.update(short_link)
        .set({ url: url, shortCode: shortCode })
        .where(and(
            eq(short_link.id, id),
            eq(short_link.userId, userId)
        )
        )
    )
};