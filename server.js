import cookieParser from "cookie-parser";
import express from "express";
import flash from "connect-flash";
import path from 'path';
import requestIp from "request-ip";
import session from "express-session";

import {shortenerRoutes} from "./routes/shortener.routes.js";
import {authRoutes} from "./routes/auth.routes.js";
import {verifyAuthentication} from "./middlewares/verify.middleware.js";

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

app.use(requestIp.mw()); //! Helps in getting IP using req.clientIP;

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