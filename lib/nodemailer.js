import nodemailer from "nodemailer";

const testAccount = await nodemailer.createTestAccount();

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.ETHEREAL_USER,
        pass: process.env.ETHEREAL_PASSWORD,
    },
});

export const sendEmail = async ({to, subject, html}) => {
    const info = await transporter.sendMail({
        from: `"URL Shortener App" <${testAccount.user}>`,
        to,
        subject,
        html,
    });

    const testEmailURL = nodemailer.getTestMessageUrl(info);
    console.log("VERIFY EMAIL:", testEmailURL);
};