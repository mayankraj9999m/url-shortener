import { z } from "zod";

const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    MONGODB_USERNAME: z.string().min(1, "MONGODB_USERNAME is required"),
    MONGODB_PASSWORD: z.string().min(1, "MONGODB_PASSWORD is required"),
    MONGODB_CLUSTER: z.string().min(1, "MONGODB_CLUSTER is required"),
    MONGODB_DATABASE: z.string().min(1, "MONGODB_DATABASE is required"),
    MONGODB_OPTIONS: z.string().optional().default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.format());
    process.exit(1);
}

export const env = parsed.data;