import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const loadLinks = async (shortCode = null) => {
    let allLinks;
    (!shortCode) ? allLinks = await prisma.shortLink.findMany() : allLinks = await prisma.shortLink.findUnique({
        where : { shortCode : shortCode }
    });
    return allLinks;
};

export const saveLinks = async (shortCode, url) => {
    try {
        await prisma.shortLink.create({
            data : {shortCode, url}
        })
        console.log(`URL Short code : ${shortCode} created.`);
    } catch (error) {
        console.log(error);
    }
};

export const deleteLinks = async (shortCode) => {
    try {
        const del_res = await prisma.shortLink.delete({
            where : { shortCode : shortCode }
        });
        return true;
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