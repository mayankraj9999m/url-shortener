import nodemailer from "nodemailer";

// const testAccount = await nodemailer.createTestAccount();

// Create a test account or replace with real credentials.
// const transporter = nodemailer.createTransport({
//     host: "smtp.ethereal.email",
//     port: 587,
//     secure: false, // true for 465, false for other ports
//     auth: {
//         user: process.env.ETHEREAL_USER,
//         pass: process.env.ETHEREAL_PASSWORD,
//     },
// });

// export const sendEmail = async ({to, subject, html}) => {
//     const info = await transporter.sendMail({
//         from: `"URL Shortener App" <${testAccount.user}>`,
//         to,
//         subject,
//         html,
//     });

//     const testEmailURL = nodemailer.getTestMessageUrl(info);
//     console.log("VERIFY EMAIL:", testEmailURL);
// };

// const transporter = nodemailer.createTransport({
//     host: "smtp.zoho.com",
//     port: 465,               // SSL (use 587 for TLS)
//     secure: true,            // true for port 465, false for 587
//     auth: {
//         user: process.env.GMAIL_USER,     // your Zoho email
//         pass: process.env.GMAIL_PASSWORD // your password or app password
//     }
// });

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,     // your Zoho email
        pass: process.env.GMAIL_PASSWORD // your password or app password
    }
});

export const sendEmail = async ({ to, subject, html }) => {
    try {
        const info = await transporter.sendMail({
            from: `"URL Shortener App" <${process.env.GMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log("Email sent:", info.response);
    } catch (err) {
        return console.error("Error sending email:", err);
    }

    // const testEmailURL = nodemailer.getTestMessageUrl(info);
    // console.log("VERIFY EMAIL:", testEmailURL);
};