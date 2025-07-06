import crypto from 'crypto';
import {deleteLinks, Devs, loadLinks, saveLinks} from '../models/shortener.model.js';
import path from 'path';
import {shortCodeSchema} from "../validators/shortcode-validator.js";

export const getShortenerPage = async (req, res) => {
    try {
        if (!req.user) return res.redirect("/login");
        const links = await loadLinks(req.user.id);

        //* Getting data of cookies (Using Node.js)
        // let cookieData = req.headers.cookie;
        // // console.log(cookieData);
        // const isLoggedIn = Boolean(cookieData?.split(';')?.find((cookie) => {
        //     return cookie.trim().startsWith('isLoggedIn')
        // })?.split('=')[1]);
        // console.log('Status(Logged IN) : ', isLoggedIn);
        // const isHuman = Boolean(cookieData?.split(';')?.find((cookie) => {
        //     return cookie.trim().startsWith('isHuman')
        // })?.split('=')[1]);
        // console.log('Status(Is HUMAN) : ', isHuman);

        //* Using cookie-parser package
        //? const isLoggedIn = req.cookies.isLoggedIn;
        //? const userName = req.cookies.userName;
        //? console.log('Status(Logged IN) : ', isLoggedIn);
        //? console.log('Status(Is HUMAN) : ', userName);

        res.render("index", {links: links, host: req.host, errors: req.flash("errors")});
    } catch (error) {
        console.error(error);
        return res.status(500).sendFile(path.join(import.meta.dirname, '..', 'views', 'server_error.html'));
    }
}

export const postURLShortener = async (req, res) => {
    if (!req.user) return res.redirect("/login");
    try {
        //* Getting links from MySQL database
        const {url, shortCode} = req.body;
        const finalShortCode = shortCode || crypto.randomBytes(4).toString('hex');

        //! Using Zod Validation
        const {data, error} = shortCodeSchema.safeParse(req.body);

        if (error) {
            const errors = error.errors.reduce((acc, e, i) => acc + `${i+1}) ` + e.message + "<br>", '');
            req.flash("errors", errors);
            return res.redirect("/");
        }

        const [links] = await loadLinks(req.user.id, shortCode);
        if (links) {
            req.flash("errors", "Short Code already exists. Please choose another.");
            return res.redirect("/");
        }

        await saveLinks(finalShortCode, url, req.user.id);

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
        const {shortCode} = req.params;
        const [links] = await loadLinks(req.user.id, shortCode);
        if (!links) return res.status(404).sendFile(path.join(import.meta.dirname, '..', 'views', '404.html'));
        console.log(`Redirected to : ${links.shortCode}`);
        return res.redirect(302, links.url);
    } catch (error) {
        console.error(error);
        return res.status(500).sendFile(path.join(import.meta.dirname, '..', 'views', 'server_error.html'));
    }
};

export const getEJSDeveloperPage = (req, res) => {
    res.render("devpage", {Devs});
};

export const deleteShortCode = async (req, res) => {
    const shortCode = req.params.id;
    const resFromDB = await deleteLinks(shortCode);
    if (resFromDB) {
        const response = {success: true, message: `Deleted Short Code: ${shortCode}`};
        res.status(200).json(response);
    } else {
        const response = {success: false, message: `Failed to delete short code: ${shortCode}`};
        res.status(401).json(response);
    }
};