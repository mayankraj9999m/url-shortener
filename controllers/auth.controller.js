import {
    comparePassword, createAccessToken,
    createRefreshToken,
    createSession, createTokens,
    createUser,
    getUserByEmail,
    hashPassword, setCookies, setSessionToInvalid
} from "../models/auth.model.js";
import {loginUserSchema, registerUserSchema} from "../validators/auth_validator.js";
import {ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY} from "../config/constants.js";

export const getRegisterPage = (req, res) => {
    if (req.user) return res.redirect("/");
    //* res.render("auth/register", {errors : req.flash("errors")});
    res.render("auth/register");
};

export const postRegister = async (req, res) => {
    if (req.user) return res.redirect("/");
    // console.log('User Account Data', req.body);
    const {name, email, password} = req.body;

    //! Validating name, email, password using Zod
    const {error} = registerUserSchema.safeParse(req.body);
    // console.log(data, error);
    if (error) {
        const errors = error.errors.reduce((acc, e, i) => acc + "<br>" + `${i + 1}) ` + e.message, '');
        return res.status(409).json({success: false, redirectTo: "/register", error: errors});
    }

    const userExists = await getUserByEmail(email);
    if (userExists) {
        // req.flash("errors", "Email is already used.");
        return res.status(409).json({success: false, redirectTo: "/register", error: "Email is already used"});
    }

    //? Hashing the password
    const hashedPassword = await hashPassword(password);

    //* Register the user
    const [user] = await createUser({name, email, password: hashedPassword});
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
        sessionId: session.insertId,
    };
    //! Creating refresh and access tokens
    const {accessToken, refreshToken} = createTokens(userInfo);

    //* Setting cookies in client's browser
    setCookies(req, res, accessToken, refreshToken);

    // Instead of redirecting server-side
    res.status(200).json({success: true, redirectTo: "/"});
}

export const getLoginPage = (req, res) => {
    if (req.user) return res.redirect("/");
    res.render("auth/login");
};

export const postLogin = async (req, res) => {
    if (req.user) return res.redirect("/");
    const {email, password} = req.body;

    //! Validating name, email, password using Zod
    const {error} = loginUserSchema.safeParse(req.body);
    // console.log(data, error);
    if (error) {
        const errors = error.errors.reduce((acc, e, i) => acc + "<br>" + `${i + 1}) ` + e.message, '');
        return res.status(401).json({success: false, redirectTo: "/login", error: errors});
    }

    //* checking if user exists or not
    const isCorrectUser = await getUserByEmail(email);
    if (!isCorrectUser) {
        return res.status(401).json({success: false, redirectTo: "/login", error: "Invalid User"});
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
            sessionId: session.insertId,
        };
        //! Creating refresh and access tokens
        const {accessToken, refreshToken} = createTokens(userInfo);

        //* Setting cookies in client's browser
        setCookies(req, res, accessToken, refreshToken);

        return res.status(200).json({success: true, redirectTo: "/"})
    } else {
        return res.status(401).json({success: false, redirectTo: "/login", error: "Incorrect Password"});
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