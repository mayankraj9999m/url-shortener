import {
    comparePassword, createEmailVerifyLink,
    createSession, createTokens,
    createUser, findUserById, generateRandomToken, getAllShortLinksByUserId,
    getUserByEmail,
    hashPassword, insertVerifyEmailToken, setCookies, setSessionToInvalid, verifyEmailInDatabase
} from "../models/auth.model.js";
import { loginUserSchema, registerUserSchema, verifyEmailSchema } from "../validators/auth_validator.js";
import { sendEmail } from "../lib/nodemailer.js";
import fs from "fs/promises";
import path from "path";
import mjml2html from "mjml";
import ejs from "ejs";

export const getRegisterPage = (req, res) => {
    if (req.user) return res.redirect("/");
    //* res.render("auth/register", {errors : req.flash("errors")});
    res.render("auth/register");
};

export const postRegister = async (req, res) => {
    if (req.user) return res.redirect("/");
    // console.log('User Account Data', req.body);
    const { name, email, password } = req.body;

    //! Validating name, email, password using Zod
    const { error } = registerUserSchema.safeParse(req.body);
    // console.log(data, error);
    if (error) {
        const errors = error.errors.reduce((acc, e, i) => acc + "<br>" + `${i + 1}) ` + e.message, '');
        return res.status(409).json({ success: false, redirectTo: "/register", error: errors });
    }

    const userExists = await getUserByEmail(email);
    if (userExists) {
        // req.flash("errors", "Email is already used.");
        return res.status(409).json({ success: false, redirectTo: "/register", error: "Email is already used" });
    }

    //? Hashing the password
    const hashedPassword = await hashPassword(password);

    //* Register the user
    const [user] = await createUser({ name, email, password: hashedPassword });
    console.log("ID:", user.insertId);

    //* Auto Login
    const session = await createSession(user.insertId, {
        ip: req.clientIp,
        userAgent: req.headers["user-agent"]
    });
    const userInfo = {
        id: user.insertId,
        name: name,
        email: email,
        isEmailVerified: false,
        sessionId: session.insertId,
    };

    //! Creating refresh and access tokens
    const { accessToken, refreshToken } = createTokens(userInfo);
    //* Setting cookies in client's browser
    setCookies(req, res, accessToken, refreshToken);

    //! SEND EMAIL FOR VERIFICATION
    res.status(200).json({ success: true, redirectTo: "/resend-verification-link" });
    // Instead of redirecting server-side
    // res.status(200).json({success: true, redirectTo: "/"});
}

export const getLoginPage = (req, res) => {
    if (req.user) return res.redirect("/");
    res.render("auth/login");
};

export const postLogin = async (req, res) => {
    if (req.user) return res.redirect("/");
    const { email, password } = req.body;

    //! Validating name, email, password using Zod
    const { error } = loginUserSchema.safeParse(req.body);
    // console.log(data, error);
    if (error) {
        const errors = error.errors.reduce((acc, e, i) => acc + "<br>" + `${i + 1}) ` + e.message, '');
        return res.status(401).json({ success: false, redirectTo: "/login", error: errors });
    }

    //* checking if user exists or not
    const isCorrectUser = await getUserByEmail(email);
    if (!isCorrectUser) {
        return res.status(401).json({ success: false, redirectTo: "/login", error: "Invalid User" });
    }

    //* Compare the password
    const hashed = await comparePassword(password, isCorrectUser.password);
    if (hashed) {
        // const token = generateToken({
        //     id: isCorrectUser.id,
        //     name: isCorrectUser.name,
        //     email: isCorrectUser.email,
        // });
        // res.cookie("JWT", token, {path: "/"});
        // res.cookie("isLoggedIn", true, {path: "/"});
        // res.cookie("userName", isCorrectUser.name, {path: "/"});
        // Instead of redirecting server-side
        //! We will create a session
        //! We will create session in sessions table
        const session = await createSession(isCorrectUser.id, {
            ip: req.clientIp,
            userAgent: req.headers["user-agent"]
        });
        const userInfo = {
            id: isCorrectUser.id,
            name: isCorrectUser.name,
            email: isCorrectUser.email,
            isEmailVerified: isCorrectUser.isEmailVerified,
            sessionId: session.insertId,
        };
        //! Creating refresh and access tokens
        const { accessToken, refreshToken } = createTokens(userInfo);

        //* Setting cookies in client's browser
        setCookies(req, res, accessToken, refreshToken);

        return res.status(200).json({ success: true, redirectTo: "/" })
    } else {
        return res.status(401).json({ success: false, redirectTo: "/login", error: "<br>Incorrect Password" });
    }

    // ! Set multiple cookies correctly
    // res.setHeader("Set-Cookie", [
    //     "isLoggedIn=true; Path=/;",
    //     `userName=${isCorrectUser.name}; Path=/;`
    // ]);
}

export const getMe = (req, res) => {
    if (!req.user) {
        res.send("<h1>Not logged in</h1>");
    } else {
        res.send(`<h1>Hey, ${req.user.name}<br>----> Email : ${req.user.email}</h1>`);
    }
}

export const logoutUser = async (req, res) => {
    //* res.clearCookie("JWT");
    //! Change session to invalid in MySQL database
    await setSessionToInvalid(req.user.sessionId);

    //! LOGOUT USER
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.redirect("/login");
}

export const getProfilePage = async (req, res) => {
    if (!req.user) return res.redirect("/login");

    //* Finding user by Id
    const user = await findUserById(req.user.id);
    if (!user) {
        res.redirect("/login");
    }

    if (req.user.isEmailVerified !== user.isEmailVerified) {
        const userInfo = {
            id: user.id,
            name: user.name,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            sessionId: req.user.sessionId,
        }

        //! Creating new refresh and access tokens and setting them
        const newTokens = createTokens(userInfo);
        setCookies(req, res, newTokens.accessToken, newTokens.refreshToken);
    }
    //* Getting shortLinks
    const userShortLinks = await getAllShortLinksByUserId(user.id);

    //* Converting date
    const options = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
    const formattedDate = new Date(user.createdAt).toLocaleDateString('en-GB', options);

    res.render("auth/profile.ejs", {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: formattedDate,
            links: userShortLinks,
            isEmailVerified: req.user.isEmailVerified,
        }
    });
}

export const getEmailVerifyPage = async (req, res) => {
    if (!req.user) return res.redirect("/login");
    const user = await findUserById(req.user.id);
    if (!user) return res.redirect("/login");
    if (req.user.isEmailVerified) return res.redirect("/profile");

    //* Send verification code
    res.render("auth/email_verify.ejs", { user: req.user });
}

export const resendVerificationLink = async (req, res) => {
    if (!req.user) return res.redirect("/login");
    const user = await findUserById(req.user.id);
    if (!user) return res.redirect("/login");
    if (req.user.isEmailVerified) return res.redirect("/profile");

    const randomToken = generateRandomToken();

    await insertVerifyEmailToken({ userId: req.user.id, token: randomToken });

    const verifyEmailLink = await createEmailVerifyLink(req, {
        email: req.user.email,
        token: randomToken
    });

    //* reading mjml file
    const mjmlTemplate = await fs.readFile(path.join(import.meta.dirname, "..", "emails", "verify_email.mjml"), "utf-8");

    //* filled template with the actual values
    const filledTemplate = ejs.render(mjmlTemplate, {
        code: randomToken,
        link: verifyEmailLink
    })

    //* converting mjml into html
    const htmlOutput = mjml2html(filledTemplate).html;

    sendEmail({
        to: req.user.email,
        subject: "Verify your email",
        html: htmlOutput
    }).catch(console.error);

    res.redirect("/verify-email");
}

export const verifyEmailToken = async (req, res) => {
    if (!req.user) return res.redirect("/login");
    const user = await findUserById(req.user.id);
    if (!user) return res.redirect("/login");
    if (req.user.isEmailVerified) return res.redirect("/profile");

    const { data, error } = verifyEmailSchema.safeParse(req.query);
    if (error) {
        return res.status(405).send({ success: false, error: "Incorrect email/token format" });
    }

    const { token, email } = data;
    if (req.user.email !== email) return res.redirect("/profile");

    const db_res_verify = await verifyEmailInDatabase(req, res, token, email);
    if (!db_res_verify) {
        return res.status(405).send({ success: false, error: "Token Expired/Invalid" });
    }

    // Success
    if (req.headers.accept.includes("application/json")) {
        return res.status(200).json({ success: true, redirectTo: "/profile" });
    } else {
        return res.redirect('/profile');
    }
}