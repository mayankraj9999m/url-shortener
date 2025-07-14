import z from "zod";

export const loginUserSchema = z.object({
    email: z
        .string()
        .trim()
        .email({message: "Enter a valid email"})
        .max(50, {message: "Email must not exceed 50 characters."}),
    password: z
        .string()
        .trim()
        .min(4, { message: "Password must be at least 4 characters long" })
        .max(50, { message: "Password must not exceed 50 characters." })
        // .regex(
        //     /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/,
        //     {
        //         message: "Password must contain uppercase, lowercase, number, and special character"
        //     }
        // ),
});

export const registerUserSchema = loginUserSchema.extend({
    name: z
        .string()
        .trim()
        .min(3, {message: "Name must be at least 3 characters long"})
        .max(30, {message: "Name must not exceed 30 characters."})
});

export const verifyEmailSchema = z.object({
    token: z.string().trim().length(8),
    email: z.string().trim().email(),
});