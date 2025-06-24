import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const FILE_PATH = path.join(import.meta.dirname, "..", "data", "links.json");

export const loadLinks = async () => {
    try {
        const links = await readFile(FILE_PATH, 'utf-8');
        return await JSON.parse(links);
    } catch (error) {
        if (error.code === "ENOENT") {
            await writeFile(FILE_PATH, JSON.stringify({}), 'utf-8');
            return {};
        } else {
            console.error("Failed to load or parse links.json:", error);
            return {}; // <== Ensure something is always returned
        }
    }
};

export const saveLinks = async (links) => {
    await writeFile(FILE_PATH, JSON.stringify(links), 'utf-8');
}

export const Devs = [
    {
        Name : "Mayank Raj",
        Skills : "Node.js/ Express.js"
    },
    {
        Name : "Ayank Raj",
        Skills : "React.js/ Express.js"
    },
];