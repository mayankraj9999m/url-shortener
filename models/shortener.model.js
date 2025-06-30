import { db } from "../config/db-client.js";

export const loadLinks = async (query, params = []) => {
    const [res] = await db.execute(query, params);
    if (!res || res.length === 0) {
        return [];
    }
    return res;
};

export const saveLinks = async (shortCode, url) => {
    try {
        await db.execute(`
            INSERT INTO short_links(short_code, url) VALUES (?, ?)`, [shortCode, url]
        );
        console.log(`URL Short code : ${shortCode} created.`);
    } catch (error) {
        console.log(error);
    }
};

export const deleteLinks = async (shortCode) => {
    try {
        // const del_res = await shortColn.updateOne({}, {$unset : {[shortCode] : 1}});
        const [del_res] = await db.execute(`DELETE FROM short_links WHERE short_code=?`, [shortCode]);
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