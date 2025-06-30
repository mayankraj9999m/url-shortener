import { z } from "zod";

const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    HOST: z.string().min(1, "HOST is required"),
    USER: z.string().min(1, "USER is required"),
    PASSWORD: z.string().min(1, "PASSWORD is required"),
    DATABASE: z.string().min(1, "DATABASE is required"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.format());
    process.exit(1);
}

export const env = parsed.data;