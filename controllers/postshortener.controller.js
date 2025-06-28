import crypto from 'crypto';
import { deleteLinks, Devs, loadLinks, saveLinks } from '../models/shortener.model.js';
import path from 'path';

export const getShortenerPage = async (req, res) => {
    try {
        const links = await loadLinks();
        res.render("index", { links: links, host: req.host })
    } catch (error) {
        console.error(error);
        return res.status(500).sendFile(path.join(import.meta.dirname, '..', 'views', 'server_error.html'));
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

        await saveLinks(finalShortCode, url);

        res.send(`<script>
            alert('Form submitted successfully!');
            window.location.href = '/'; // redirect to homepage (or any page)
            </script>
        `);
    } catch (error) {
        console.log(error);
        return res.status(500).sendFile(path.join(import.meta.dirname, '..', 'views', 'server_error.html'));
    }
};

export const redirectToShortLink = async (req, res) => {
    try {
        const links = await loadLinks();
        const { shortCode } = req.params;
        if (!links[shortCode]) return res.status(404).sendFile(path.join(import.meta.dirname, '..', 'views', '404.html'));
        console.log(`Redirected to : ${links[shortCode]}`);
        return res.redirect(302,links[shortCode]);
    } catch (error) {
        console.error(error);
        return res.status(500).sendFile(path.join(import.meta.dirname, '..', 'views', 'server_error.html'));
    }
};

export const getEJSDeveloperPage = (req, res) => {
    res.render("devpage", { Devs });
};

export const deleteShortCode = async (req, res) => {
    const shortCode = req.params.id;
    const resFromDB = await deleteLinks(shortCode);
    if (resFromDB) {
        const response = { success: true, message: `Deleted Short Code: ${shortCode}` };
        res.status(200).json(response);
    } else {
        const response = { success: false, message: `Failed to delete short code: ${shortCode}` };
        res.status(400).json(response);
    };
};