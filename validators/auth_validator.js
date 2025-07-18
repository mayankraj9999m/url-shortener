import z from "zod";

export const loginUserSchema = z.object({
    email: z
        .string()
        .trim()
        .email({ message: "Enter a valid email" })
        .max(50, { message: "Email must not exceed 50 characters." }),
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
        .min(3, { message: "Name must be at least 3 characters long" })
        .max(30, { message: "Name must not exceed 30 characters." })
});

export const verifyEmailSchema = z.object({
    token: z.string().trim().length(8),
    email: z.string().trim().email(),
});

export const changeNameSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, { message: "Name must be at least 3 characters long" })
        .max(30, { message: "Name must not exceed 30 characters." })
});

// Reusable password matching refinement
const passwordsMatch = (schema) =>
    schema.refine((data) => data.newPassword === data.confirmNewPassword, {
        message: "Passwords do not match",
        path: ["confirmNewPassword"],
    });

// Base schema for new password fields
export const baseSchema = z.object({
    newPassword: z
        .string()
        .trim()
        .min(8, { message: "New password must at least 8 characters long" })
        .max(40, { message: "New password must be less than 40 characters long" })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/, {
            message:
                "Password must contain uppercase, lowercase, number, and special character",
        }),
    confirmNewPassword: z
        .string()
        .trim()
        .min(1, { message: "Confirm password can't be empty" }),
});

// Schema for resetting password (only new password + confirm)
export const resetPasswordSchema = passwordsMatch(baseSchema);

// Schema for changing password (requires current password too)
export const changePasswordSchema = passwordsMatch(
    baseSchema.extend({
        currPassword: z
            .string()
            .trim()
            .min(1, { message: "Current password is required" }),
    })
);

export const forgotPasswordSchema = z.object({
    email: z
        .string()
        .trim()
        .email({ message: "Enter a valid email" })
        .max(50, { message: "Email must not exceed 50 characters." }),
});