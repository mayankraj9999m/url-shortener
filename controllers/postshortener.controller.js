import crypto from 'crypto';
import { Devs, loadLinks, saveLinks } from '../models/shortener.model.js';
import { readFile } from 'fs/promises';
import path from 'path';

export const getShortenerPage = async (req, res) => {
    try {
        const PATH_HTML = path.join(import.meta.dirname, "..", "views", "index.html");
        let file = await readFile(PATH_HTML);
        const links = await loadLinks();
        file = file.toString().replaceAll("{{Urls go here}}",
            Object.entries(links).map(([shortCode, url]) => {
                return `<li><a href="/${shortCode}" target="_blank">${req.host}/${shortCode}</a><p>${url}</p></li>`
            }).join("")
        );
        res.send(file);
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
    }
}

export const postURLShortener = async (req, res) => {
    try {
        //* Getting links.json data
        const links = await loadLinks();
        const { url, shortCode } = req.body;

        const finalShortCode = shortCode || crypto.randomBytes(4).toString('hex');

        if (links[finalShortCode]) {
            return res.status(400).send("Short Code already exists. Please choose another.");
        }

        links[finalShortCode] = url;
        await saveLinks(links);
        res.send(`<script>
            alert('Form submitted successfully!');
            window.location.href = '/'; // redirect to homepage (or any page)
            </script>
        `);
    } catch (error) {
        console.log(error);
    }
};

export const redirectToShortLink = async (req, res) => {
    try {
        const links = await loadLinks();
        const { shortCode } = req.params;
        if (!links[shortCode]) return res.status(404).send("Error 404 : Shortened URL not found.");
        return res.status(302).redirect(links[shortCode]);
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error")
    }
};

export const getEJSDeveloperPage = (req, res) => {
    res.render("report", { Devs });
}