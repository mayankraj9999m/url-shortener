import express from "express";
import path from 'path';
import {shortenerRoutes} from "./routes/shortener.routes.js";

const app = express();

app.use(express.static(path.join(import.meta.dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Lecture 53 : Template Engines (ejs)
app.set("view engine", "ejs");
// app.set("views", "./views");

// express router
app.use(shortenerRoutes);

// Error page
app.use((req, res) => {
    res.status(404).sendFile(path.join(import.meta.dirname, 'views', '404.html'));
});

//*Listening to server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});