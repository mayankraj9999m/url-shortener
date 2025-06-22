import { createServer } from 'http';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const FILE_PATH = path.join("data", "links.json");

const serveFile = async (res, filepath, type) => {
    try {
        const data = await readFile(filepath);
        res.writeHead(200, { 'Content-Type': `text/${type}` });
        return res.end(data); 
    } catch (error) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        return res.end("Error 404 : Page not Found");
    }
}

const loadLinks = async () => {
    try {
        const links = await readFile(FILE_PATH, 'utf-8');
        return await JSON.parse(links);
    } catch(error) {
        if (error.code === "ENOENT") {
            await writeFile(FILE_PATH, JSON.stringify({}), 'utf-8');
            return {};
        } else {
            console.error("Failed to load or parse links.json:", error);
            return {}; // <== Ensure something is always returned
        }
    }
};

const saveLinks = async (links) => {
    await writeFile(FILE_PATH, JSON.stringify(links), 'utf-8');
}

const server = createServer(async (req, res) => {
    if (req.method === "GET") {
        if (req.url === '/') {
            return serveFile(res, path.join("public", "index.html"), 'html');
        } else if (req.url === '/style.css') {
            return serveFile(res, path.join("public", "style.css"), 'css');
        } else if (req.url === '/getlinks') {
            const links = await loadLinks();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(links));
        } else {
            const links = await loadLinks();
            const shortCode = req.url.slice(1);
            if (links[shortCode]) {
                res.writeHead(302, { location: links[shortCode] });
                return res.end();
            }

            res.writeHead(404, { 'Content-Type': 'text/html' });
            return res.end("Error 404 : Shortened URL not found.");
        }
    }
    else if (req.method === "POST" && req.url === '/shorten') {
        //* Getting links.json data
        const links = await loadLinks();

        //* Getting request data
        let body = "";
        req.on('data', (chunk) => body += chunk);
        req.on('end', async () => {
            console.log(body);
            const { url, shortCode } = JSON.parse(body);
            if (!url) {
                res.writeHead(400, { 'Content-Type': 'text/html' });
                return res.end("URL is required");
            };

            const finalShortCode = shortCode || crypto.randomBytes(4).toString('hex');

            if (links[finalShortCode]) {
                res.writeHead(400, { 'Content-Type': 'text/html' });
                return res.end("Short Code already exists. Please choose another.");
            }

            links[finalShortCode] = url;
            await saveLinks(links);

            //* Status : 200
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({success : true, shortCode : finalShortCode}));
        });
    };
});

//*Listening to server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});