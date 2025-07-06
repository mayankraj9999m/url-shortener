import {comparePassword, createUser, generateToken, getUserByEmail, hashPassword} from "../models/auth.model.js";
import {loginUserSchema, registerUserSchema} from "../validators/auth_validator.js";

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
    const {data, error} = registerUserSchema.safeParse(req.body);
    // console.log(data, error);
    if (error) {
        const errors = error.errors.reduce((acc, e, i) => acc + "<br>" + `${i+1}) ` + e.message, '');
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

    // Instead of redirecting server-side
    res.status(200).json({success: true, redirectTo: "/login"});
}

export const getLoginPage = (req, res) => {
    if (req.user) return res.redirect("/");
    res.render("auth/login");
};

export const postLogin = async (req, res) => {
    if (req.user) return res.redirect("/");
    const { email, password } = req.body;

    //! Validating name, email, password using Zod
    const {data, error} = loginUserSchema.safeParse(req.body);
    // console.log(data, error);
    if (error) {
        const errors = error.errors.reduce((acc, e, i) => acc + "<br>" + `${i+1}) ` + e.message, '');
        return res.status(401).json({success: false, redirectTo: "/login", error: errors});
    }

    const isCorrectUser = await getUserByEmail(email);
    if (!isCorrectUser) {
        return res.status(401).json({success: false, redirectTo: "/login", error: "Invalid User"});
    }

    //* Compare the password
    const hashed = await comparePassword(password, isCorrectUser.password);
    if (hashed) {
        const token = generateToken({
            id: isCorrectUser.id,
            name: isCorrectUser.name,
            email: isCorrectUser.email
        });
        res.cookie("JWT", token, {path: "/"});
        // res.cookie("isLoggedIn", true, {path: "/"});
        // res.cookie("userName", isCorrectUser.name, {path: "/"});
        // Instead of redirecting server-side
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

export const logoutUser = (req, res) => {
    res.clearCookie("JWT");
    res.redirect("/login");
}