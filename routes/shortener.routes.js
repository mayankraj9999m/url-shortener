import express from 'express';
import { postURLShortener, getShortenerPage, redirectToShortLink, getEJSDeveloperPage } from '../controllers/postshortener.controller.js';

// Lecture 52 : Express Router
const router = express.Router();

router.get("/", getShortenerPage);

router.post("/", postURLShortener);

router.get("/dev", getEJSDeveloperPage);

router.get("/:shortCode", redirectToShortLink);

export const shortenerRoutes = router;