import express from 'express';
import {
    postURLShortener,
    getShortenerPage,
    redirectToShortLink,
    getEJSDeveloperPage,
    deleteShortCode,
    editShortLink,
    generateQR
} from '../controllers/postshortener.controller.js';

// Lecture 52 : Express Router
const router = express.Router();

router.get("/", getShortenerPage);

router.post("/", postURLShortener);

router.get("/dev", getEJSDeveloperPage);

router.get('/generate', generateQR);

router.get("/:shortCode", redirectToShortLink);

router.patch("/edit/:id", editShortLink);

router.delete('/delete/:id', deleteShortCode);

export const shortenerRoutes = router;