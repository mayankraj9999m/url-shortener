import z from "zod";

export const shortCodeSchema = z.object({
    url : z
        .string({required_error : "URL is required"})
        .trim()
        .url({message: "Please enter a valid URL"})
        .max(1024, {message: "URL cannot be longer than 1024 characters"}),
    shortCode : z
        .string({required_error : "Short code is required"})
        .trim()
        .min(1, {message: "Short Code must be at least 1 character"})
        .max(20, {message: "Short Code must not exceed 20 characters"}),
});