import {
    changeNameInMySQL,
    changePasswordInMySql,
    changeProfileUrlInMySql,
    comparePassword, createEmailVerifyLink,
    createSession, createTokens,
    createUser, createUserWithOauth, deleteResetTokens, findUserById, generateRandomToken, getAllShortLinksByUserId,
    getUserByEmail,
    getUserWithOauthId,
    hashPassword, insertResetTokenInDatabase, insertVerifyEmailToken, linkUserWithOauth, resetPasswordInMySql, resetPasswordLink, setCookies, setSessionToInvalid, validatePasswordResetToken, verifyEmailInDatabase
} from "../models/auth.model.js";
import { changeNameSchema, changePasswordSchema, forgotPasswordSchema, loginUserSchema, registerUserSchema, resetPasswordSchema, verifyEmailSchema } from "../validators/auth_validator.js";
// import { sendEmail } from "../lib/send-email.js";
import { sendEmail } from "../lib/nodemailer.js";
import { readEmailFile } from "../lib/readEmailFile.js";
import crypto from "crypto";
import { decodeIdToken, generateCodeVerifier, generateState, GitHub } from "arctic";
import { OAUTH_EXCHANGE_EXPIRY } from "../config/constants.js";
import { google } from "../lib/oauth/google.js";
import { github } from "../lib/oauth/github.js";

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
};

export const getLoginPage = (req, res) => {
    if (req.user) return res.redirect("/");
    res.render("auth/login", { errors: req.flash("errors") });
};

export const postLogin = async (req, res) => {
    if (req.user) return res.redirect("/");
    const { email, password } = req.body;

    //! Validating name, email, password using Zod
    const result = loginUserSchema.safeParse(req.body);
    if (!result.success) {
        const errors = result.error.errors.reduce((acc, e, i) => acc + "<br>" + `${i + 1}) ` + e.message, '');
        return res.status(401).json({ success: false, redirectTo: "/login", error: errors });
    }

    //* checking if user exists or not
    const isCorrectUser = await getUserByEmail(email);
    if (!isCorrectUser) {
        return res.status(401).json({ success: false, redirectTo: "/login", error: "Invalid User" });
    }

    if (!isCorrectUser.password) {
        // database hash password
        // if password is null
        return res.status(401).json({ success: false, redirectTo: "/login", error: "You have created account using social login. Please login with your social account." });
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
};

export const getMe = (req, res) => {
    if (!req.user) {
        res.send("<h1>Not logged in</h1>");
    } else {
        res.send(`<h1>Hey, ${req.user.name}<br>----> Email : ${req.user.email}</h1>`);
    }
};

export const logoutUser = async (req, res) => {
    //* res.clearCookie("JWT");
    //! Change session to invalid in MySQL database
    await setSessionToInvalid(req.user.sessionId);

    //! LOGOUT USER
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.redirect("/login");
};

export const getProfilePage = async (req, res) => {
    if (!req.user) return res.redirect("/login");

    //* Finding user by Id
    const user = await findUserById(req.user.id);

    if (!user) {
        return await logoutUser(req, res);
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
            onlineSignIn: !user.password,
            avatarUrl: user.avatarUrl
        }
    });
};

export const getChangeProfilePage = async (req, res) => {
    if (!req.user) return res.redirect("/");

    //* Finding user by Id
    const user = await findUserById(req.user.id);

    if (!user) {
        return await logoutUser(req, res);
    }

    return res.render("auth/change_profile.ejs", { name: user.name, avatarUrl: user.avatarUrl });
}

export const postChangeProfile = async (req, res) => {
    if (!req.user) return res.redirect("/");
    //* Finding user by Id
    const user = await findUserById(req.user.id);

    if (!user) {
        return await logoutUser(req, res);
    }

    try {
        //! Validating name using Zod
        const { data, error } = changeNameSchema.safeParse(req.body);
        if (error) {
            return res.status(401).json({ success: false, error: error.errors[0].message });
        }

        const fileUrl = req.file ? `uploads/avatar/${req.file.filename}` : null;

        await changeProfileUrlInMySql({
            id: req.user.id,
            name: data.name,
            avatarUrl: fileUrl,
        });

        const userInfo = {
            id: req.user.id,
            name: req.body.name,
            email: req.user.email,
            isEmailVerified: req.user.isEmailVerified,
            sessionId: req.user.sessionId,
        }

        //! Creating new refresh and access tokens and setting them
        const newTokens = createTokens(userInfo);
        setCookies(req, res, newTokens.accessToken, newTokens.refreshToken);

        return res.status(200).send({ success: true, redirectTo: "/profile" });
    } catch (error) {
        console.log(error);
        return res.status(401).send({ success: false, error: "Can't update" });
    }
}

export const changeName = async (req, res) => {
    if (!req.user) return res.redirect("/");
    const { name } = req.body;

    try {
        //! Validating name using Zod
        const result = changeNameSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(401).json({ success: false, error: result.error.errors[0].message });
        }

        await changeNameInMySQL(name, req.user.id);

        const userInfo = {
            id: req.user.id,
            name: name,
            email: req.user.email,
            isEmailVerified: req.user.isEmailVerified,
            sessionId: req.user.sessionId,
        }

        //! Creating new refresh and access tokens and setting them
        const newTokens = createTokens(userInfo);
        setCookies(req, res, newTokens.accessToken, newTokens.refreshToken);

        return res.status(200).send({ success: true });
    } catch (error) {
        console.log(error);
        return res.status(401).send({ success: false, error: "Can't update" });
    }
};

export const getEmailVerifyPage = async (req, res) => {
    if (!req.user) return res.redirect("/login");
    const user = await findUserById(req.user.id);
    if (!user) return await logoutUser(req, res);
    if (req.user.isEmailVerified) return res.redirect("/profile");

    //* Send verification code
    res.render("auth/email_verify.ejs", { user: req.user });
};

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

    const payload = {
        code: randomToken,
        link: verifyEmailLink
    }
    const htmlOutput = await readEmailFile("reset_password", payload);

    sendEmail({
        to: req.user.email,
        subject: "Verify your email",
        html: htmlOutput
    }).catch(console.error);

    res.redirect("/verify-email");
};

export const verifyEmailToken = async (req, res) => {
    if (!req.user) return res.redirect("/login");
    const user = await findUserById(req.user.id);
    if (!user) return await logoutUser(req, res);
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

    // console.log("Request headers:", req.headers);
    // console.log("User:", req.user);

    // Success
    if (req.headers.accept.includes("application/json")) {
        return res.status(200).json({ success: true, redirectTo: "/profile" });
    } else {
        return res.redirect('/profile');
    }
};

export const getchangePasswordPage = (req, res) => {
    if (!req.user) return res.redirect("/login");

    res.render("auth/change_password.ejs");
};

export const changePassword = async (req, res) => {
    if (!req.user) return res.redirect("/login");
    const data = req.body;

    //! Zod Validation
    const { error } = changePasswordSchema.safeParse(data);

    if (error) {
        const errors = error.errors.reduce((acc, e, i) => acc + `${i + 1}) ` + e.message + "<br>", '');
        return res.status(409).json({ success: false, redirectTo: "/change-password", error: errors });
    }

    const updateRes = await changePasswordInMySql(data, req.user.id);

    if (!updateRes) {
        return res.status(409).json({
            success: false, redirectTo: "/change-password", error: `Wrong current password/ maybe you logged in with google.<br>
            Steps:<br>
            \t1. Please logout<br>
            2. Go to login page<br>
            3. Click on forgot password<br>
            4. Enter your registered email<br>
            5. You will get verification link on your registered email<br>
            6. Click on the link to set new password` });
    }
    if (updateRes.affectedRows === 0) {
        return res.status(409).json({ success: false, redirectTo: "/change-password", error: "DATABASE ERROR : Password can't be changed" });
    }

    return res.status(200).json({ success: true, redirectTo: "/profile" });
};

export const getForgotPasswordPage = (req, res) => {
    if (req.user) return res.redirect("/profile");

    res.render("auth/forgot_password.ejs");
};

export const sendResetEmail = async (req, res) => {
    if (req.user) return res.redirect("/profile");
    const data = req.body;

    //! Email Zod Validation
    const { error } = forgotPasswordSchema.safeParse(data);
    if (error) {
        const errors = error.errors.reduce((acc, e, i) => acc + `${i + 1}) ` + e.message + "<br>", '');
        return res.status(409).json({ success: false, redirectTo: "/forgot-password", error: errors });
    }

    const userExists = await getUserByEmail(data.email);
    if (!userExists) {
        return res.status(200).json({ success: true, redirectTo: "/forgot-password" });
    }

    //! If user exists, generate token
    const randomToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(randomToken).digest("hex");

    //* Insert token in the database
    const [insertRes] = await insertResetTokenInDatabase(tokenHash, userExists.id);

    if (!insertRes.affectedRows) {
        return res.status(200).json({ success: true, redirectTo: "/forgot-password" });
    }

    const resetLink = resetPasswordLink(req, tokenHash);

    const payload = {
        name: userExists.name,
        link: resetLink
    };
    const htmlOutput = await readEmailFile("reset_password", payload);

    sendEmail({
        to: userExists.email,
        subject: `Hi, ${userExists.name}, reset your password`,
        html: htmlOutput
    }).catch(console.error);

    return res.status(200).json({ success: true, redirectTo: "/forgot-password" });
};

export const getResetPasswordPage = async (req, res) => {
    const { token } = req.params;
    //! Verify password reset token in database
    const [isValidToken] = await validatePasswordResetToken(token);

    if (!isValidToken) {
        return res.render("auth/token_exp_invalid.ejs");
    }

    res.render("auth/reset_password.ejs");
};

export const resetPassword = async (req, res) => {
    const { token } = req.params;
    //! Verify password reset token in database
    const [isValidToken] = await validatePasswordResetToken(token);

    if (!isValidToken) {
        return res.render("auth/token_exp_invalid.ejs");
    }

    // const { newPassword, confirmNewPassword } = req.body;
    const data = req.body;

    //! Zod Validation
    const { error } = resetPasswordSchema.safeParse(data);
    if (error) {
        const errors = error.errors.reduce((acc, e, i) => acc + `${i + 1}) ` + e.message + "<br>", '');
        return res.status(409).json({ success: false, redirectTo: `/forgot-password/${token}`, error: errors });
    }

    //! Reset the current password
    const updateRes = await resetPasswordInMySql(data, isValidToken.userId);
    if (updateRes.affectedRows === 0) {
        return res.status(409).json({ success: false, redirectTo: `/forgot-password/${token}`, error: "DATABASE ERROR : Password can't be changed" });
    }

    //! Delete that reset token, and all expired tokens from table
    await deleteResetTokens(token);
    return res.status(200).json({ success: true, redirectTo: "/login" });
};

//! --------------------------------------------------------------------
//!                         Google OAuth Signin
//! --------------------------------------------------------------------
//* Redirecting user to google login page when "Sign In With Google" selected
export const getGoogleLoginPage = async (req, res) => {
    if (req.user) return res.redirect("/");

    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const url = google.createAuthorizationURL(state, codeVerifier, [
        "openid", "profile", "email"
    ])

    const cookieConfig = {
        httpOnly: true,
        secure: true,
        maxAge: OAUTH_EXCHANGE_EXPIRY, // 10 minutes time for login
        sameSite: "lax", // this is such that when google redirects to our website, cookies are maintained 
    };

    res.cookie("google_oauth_state", state, cookieConfig);
    res.cookie("google_code_verifier", codeVerifier, cookieConfig);

    return res.redirect(url.toString()); // returning authorization url
};

//* When google responds to google/callback
export const getGoogleLoginCallback = async (req, res) => {
    // google redirects with code, and state in query params
    // we will use code to find out the user
    if (req.user) return res.redirect("/");
    const { code, state } = req.query;

    const {
        google_oauth_state: storedState,
        google_code_verifier: codeVerifier,
    } = req.cookies;

    if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
        req.flash("errors", "Couldn't login with google due to invalid login attempt. Please try again.");
        return res.redirect("/login");
    }

    let tokens;
    try {
        tokens = await google.validateAuthorizationCode(code, codeVerifier);
    } catch (error) {
        req.flash("errors", "Couldn't login with google due to invalid login attempt. Please try again.");
        return res.redirect("/login");
    }

    const claims = decodeIdToken(tokens.idToken());
    const { sub: googleUserId, name, email, picture } = claims;

    //! There are few things that we should do
    //! Condition 1: User already exists with google's oauth linked
    //! Condition 2: User already exists with the same email but google's oauth isn't linked
    //! Condition 3: User doesn't exist.

    // if user is already linked then we will get the user    
    let user = await getUserWithOauthId({
        provider: "google",
        email,
    });

    // if user exists but user is not linked with oauth
    if (user && !user.providerAccountId) {
        await linkUserWithOauth({
            userId: user.id,
            provider: "google",
            providerAccountId: googleUserId,
            avatarUrl: picture,
        });
    }

    // if user doesn't exist
    if (!user) {
        user = await createUserWithOauth({
            name,
            email,
            provider: "google",
            providerAccountId: googleUserId,
            avatarUrl: picture,
        });
    }

    const session = await createSession(user.id, {
        ip: req.clientIp,
        userAgent: req.headers["user-agent"]
    });

    const userInfo = {
        id: user.id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        sessionId: session.insertId,
    };

    //! Creating refresh and access tokens
    const { accessToken, refreshToken } = createTokens(userInfo);
    //* Setting cookies in client's browser
    setCookies(req, res, accessToken, refreshToken);

    res.redirect("/");
};

//! --------------------------------------------------------------------
//!                         GitHub OAuth Signin
//! --------------------------------------------------------------------
export const getGithubLoginPage = async (req, res) => {
    if (req.user) return res.redirect("/");

    const state = generateState();
    const url = github.createAuthorizationURL(state, ["user:email"]);

    const cookieConfig = {
        httpOnly: true,
        secure: true,
        maxAge: OAUTH_EXCHANGE_EXPIRY, // 10 minutes time for login
        sameSite: "lax", // this is such that when google redirects to our website, cookies are maintained 
    };

    res.cookie("github_oauth_state", state, cookieConfig);

    return res.redirect(url.toString()); // returning authorization url
};

export const getGithubLoginCallback = async (req, res) => {
    const { code, state } = req.query;
    const { github_oauth_state: storedState } = req.cookies;

    function handleFailedLogin() {
        req.flash(
            "errors",
            "Couldn't login with GitHub because of invalid login attempt. Please try again!"
        );
        return res.redirect("/login");
    }

    if (!code || !state || !storedState || state !== storedState) {
        return handleFailedLogin();
    }

    let tokens;
    try {
        tokens = await github.validateAuthorizationCode(code);
    } catch {
        return handleFailedLogin();
    }

    const githubUserResponse = await fetch("https://api.github.com/user", {
        headers: {
            Authorization: `Bearer ${tokens.accessToken()}`,
        },
    });
    if (!githubUserResponse.ok) return handleFailedLogin();
    const githubUser = await githubUserResponse.json();
    const { id: githubUserId, name } = githubUser;

    const githubEmailResponse = await fetch(
        "https://api.github.com/user/emails",
        {
            headers: {
                Authorization: `Bearer ${tokens.accessToken()}`,
            },
        }
    );
    if (!githubEmailResponse.ok) return handleFailedLogin();

    const emails = await githubEmailResponse.json();
    const email = emails.filter((e) => e.primary)[0].email; // In GitHub we can have multiple emails, but we only want primary email
    if (!email) return handleFailedLogin();

    // there are few things that we should do
    //! Condition 1: User already exists with github's oauth linked
    //! Condition 2: User already exists with the same email but github's oauth isn't linked
    //! Condition 3: User doesn't exist.

    let user = await getUserWithOauthId({
        provider: "github",
        email,
    });

    if (user && !user.providerAccountId) {
        await linkUserWithOauth({
            userId: user.id,
            provider: "github",
            providerAccountId: githubUserId,
        });
    }

    if (!user) {
        user = await createUserWithOauth({
            name,
            email,
            provider: "github",
            providerAccountId: githubUserId,
        });
    }

    const session = await createSession(user.id, {
        ip: req.clientIp,
        userAgent: req.headers["user-agent"]
    });

    const userInfo = {
        id: user.id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        sessionId: session.insertId,
    };

    //! Creating refresh and access tokens
    const { accessToken, refreshToken } = createTokens(userInfo);
    //* Setting cookies in client's browser
    setCookies(req, res, accessToken, refreshToken);

    res.redirect("/");
};

export const getSetPasswordPage = async (req, res) => {
    if (!req.user) return res.redirect("/login");

    //* Finding user by Id
    const user = await findUserById(req.user.id);
    if (!user || user.password) {
        await logoutUser(req, res); // if user doesn't exists or if user has already a password then logout the signed in user to prevent unauthorized access to set password page
    }

    return res.render("auth/set_password.ejs");
};

export const setPassword = async (req, res) => {
    if (!req.user) return res.redirect("/login");

    //* Finding user by Id
    const user = await findUserById(req.user.id);

    if (!user || user.password) {
        await logoutUser(req, res);
    }
    // const { newPassword, confirmNewPassword } = req.body;
    const data = req.body;

    //! Zod Validation
    const { error } = resetPasswordSchema.safeParse(data);
    if (error) {
        const errors = error.errors.reduce((acc, e, i) => acc + `${i + 1}) ` + e.message + "<br>", '');
        return res.status(409).json({ success: false, redirectTo: `/set-password`, error: errors });
    }

    //! Reset the current password
    const updateRes = await resetPasswordInMySql(data, user.id);
    if (updateRes.affectedRows === 0 || !updateRes) {
        return res.status(409).json({ success: false, redirectTo: `/set-password`, error: "DATABASE ERROR : Password can't be changed" });
    }

    return res.status(200).json({ success: true, redirectTo: "/login" });
}