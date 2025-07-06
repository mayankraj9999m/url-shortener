import express from "express";
import * as authControllers from "../controllers/auth.controller.js";
import path from "path";

const router = express.Router();

router.use(express.static(path.join(import.meta.dirname, "..", "auth_styles")));
router.use(express.json()); // Parse the JSON incoming from frontend

router
    .route("/register")
    .get(authControllers.getRegisterPage)
    .post(authControllers.postRegister);
router
    .route("/login")
    .get(authControllers.getLoginPage)
    .post(authControllers.postLogin);
router
    .route("/me")
    .get(authControllers.getMe);
router
    .route("/logout")
    .get(authControllers.logoutUser);

export const authRoutes = router;