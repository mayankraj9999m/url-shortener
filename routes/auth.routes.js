import express from "express";
import * as authControllers from "../controllers/auth.controller.js";
import path from "path";

const router = express.Router();

router.use(express.static(path.join(import.meta.dirname, "..", "auth_styles")));
router.use(express.json()); // Parse the JSON incoming from frontend

//! Login and register page
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

//! Profile page
router
    .route("/profile")
    .get(authControllers.getProfilePage);
router
    .route("/verify-email")
    .get(authControllers.getEmailVerifyPage);
router
    .route("/resend-verification-link")
    .get(authControllers.resendVerificationLink);
router
    .route("/verify-email-token")
    .get(authControllers.verifyEmailToken);

//! Updating User details
router
    .route("/change-password")
    .get(authControllers.getchangePasswordPage)
    .post(authControllers.changePassword);
router
    .route("/change-name")
    .post(authControllers.changeName);
router
    .route("/forgot-password")
    .get(authControllers.getForgotPasswordPage)
    .post(authControllers.sendResetEmail);
router
    .route("/forgot-password/:token")
    .get(authControllers.getResetPasswordPage)
    .post(authControllers.resetPassword);

//! Logout the user
router
    .route("/logout")
    .get(authControllers.logoutUser);

export const authRoutes = router;