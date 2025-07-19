import crypto from 'crypto';
import { deleteLinks, Devs, editShortLinkDatabase, loadLinks, saveLinks } from '../models/shortener.model.js';
import path from 'path';
import { shortCodeSchema, shortenerSearchParamsSchema } from "../validators/shortcode-validator.js";
import z from "zod";

export const getShortenerPage = async (req, res) => {
    if (!req.user) return res.redirect("/login");
    try {
        const { data: searchParams, error } = shortenerSearchParamsSchema.safeParse(req.query);

        // const links = await loadLinks(req.user.id);
        const { shortLinks, totalCount } = await loadLinks({
            userId: req.user.id,
            limit: 10,
            offset: (searchParams.page - 1) * 10
        });

        //! totalCount = 100
        const totalPages = Math.ceil(totalCount / 10);

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

        res.render("index", { links: shortLinks, host: req.host, currentPage: searchParams.page, totalPages: totalPages, errors: req.flash("errors") });
    } catch (error) {
        console.error(error);
        return res.status(500).sendFile(path.join(import.meta.dirname, '..', 'views', 'server_error.html'));
    }
}

export const postURLShortener = async (req, res) => {
    if (!req.user) return res.redirect("/login");
    try {
        //* Getting links from MySQL database
        const { url, shortCode } = req.body;
        const finalShortCode = shortCode || crypto.randomBytes(4).toString('hex');

        //! Using Zod Validation
        const { error } = shortCodeSchema.safeParse({ url, shortCode: finalShortCode });

        if (error) {
            const errors = error.errors.reduce((acc, e, i) => acc + `${i + 1}) ` + e.message + "<br>", '');
            req.flash("errors", errors);
            return res.redirect("/");
        }

        const { shortLinks } = await loadLinks({ userId: req.user.id, shortCode: finalShortCode });
        const links = shortLinks?.[0] || null;
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
        const { shortCode } = req.params;
        console.log(req.params);
        if (!req.user) return res.status(404).sendFile(path.join(import.meta.dirname, '..', 'views', '404.html'));
        const { shortLinks } = await loadLinks({ userId: req.user.id, shortCode: shortCode });
        const links = shortLinks?.[0] || null;
        if (!links) return res.status(404).sendFile(path.join(import.meta.dirname, '..', 'views', '404.html'));
        console.log(`Redirected to : ${links.shortCode}`);
        return res.redirect(302, links.url);
    } catch (error) {
        console.error(error);
        return res.status(500).sendFile(path.join(import.meta.dirname, '..', 'views', 'server_error.html'));
    }
};

export const getEJSDeveloperPage = (req, res) => {
    res.render("devpage", { Devs });
};

export const deleteShortCode = async (req, res) => {
    if (!req.user) return res.redirect("/login");
    const shortCode = req.params.id;
    const resFromDB = await deleteLinks(shortCode, req.user.id);
    if (resFromDB) {
        const response = { success: true, message: `Deleted Short Code: ${shortCode}` };
        res.status(200).json(response);
    } else {
        const response = { success: false, message: `Failed to delete short code: ${shortCode}` };
        res.status(401).json(response);
    }
};

export const editShortLink = async (req, res) => {
    if (!req.user) return res.redirect("/login");

    // Validating id
    const { data: id, error } = z.coerce.number().int().safeParse(req.params.id);
    if (error) return res.status(404).sendFile(path.join(import.meta.dirname, '..', 'views', '404.html'));

    const { url, shortCode } = req.body;

    //! Using Zod Validation
    const { error: validationError } = shortCodeSchema.safeParse(req.body);

    if (validationError) {
        const errors = validationError.errors.reduce((acc, e, i) => acc + `${i + 1}) ` + e.message + "<br>", '<br>');
        return res.status(409).json({ success: false, redirectTo: "/", error: errors });
    }
    try {
        const resp = await editShortLinkDatabase(id, url, shortCode, req.user.id);
        if (!resp[0].affectedRows) return res.status(404).json({ success: false, redirectTo: "/", error: "Can't update short code<br>May be deleted" });
        return res.status(200).json({ success: true, redirectTo: "/" });
    } catch (err) {
        console.error(err);
        return res.status(500).sendFile(path.join(import.meta.dirname, '..', 'views', 'server_error.html'));
    }
}