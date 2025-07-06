import express from "express";
import path from 'path';
import {shortenerRoutes} from "./routes/shortener.routes.js";
import {authRoutes} from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import {verifyAuthentication} from "./middlewares/verify.middleware.js";
import session from "express-session";
import flash from "connect-flash";

const app = express();

app.use(express.static(path.join(import.meta.dirname, "public")));
app.use(express.urlencoded({extended: true}));

// Lecture 53 : Template Engines (ejs)
app.set("view engine", "ejs");
// app.set("views", "./views");

//* Cookie Parser middleware
//? You need cookie-parser when you want to read cookies sent by the client in incoming HTTP requests.
app.use(cookieParser());

app.use(session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: false
}));

app.use(flash());

//* Verify JWT Token Middleware
app.use(verifyAuthentication);

//* Now, creating a global req.locals.user
app.use((req, res, next) => {
    res.locals.username = req["user"]?.name;
    next();
})

// Routes (1. Authentication, 2. Pages)
app.use(authRoutes);
app.use(shortenerRoutes);

// Error page (when client visits an undefined route)
app.use((req, res) => {
    res.status(404).sendFile(path.join(import.meta.dirname, 'views', '404.html'));
});

//*Listening to server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});