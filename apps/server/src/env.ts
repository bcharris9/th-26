import { z } from "zod";

const booleanFromEnv = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no"].includes(normalized)) {
      return false;
    }
  }
  return value;
}, z.boolean());

const envSchema = z.object({
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).optional(),
  ELEVENLABS_API_KEY: z.string().min(1).optional(),
  ELEVENLABS_VOICE_ID: z.string().min(1).optional(),
  ELEVENLABS_TTS_MODEL: z.string().min(1).optional(),
  ELEVENLABS_STT_MODEL: z.string().min(1).optional(),
  NESSIE_API_KEY: z.string().min(1, "NESSIE_API_KEY is required"),
  CONFIRMATION_SECRET: z.string().min(1, "CONFIRMATION_SECRET is required"),
  PYTHON_AI_BASE: z.string().min(1).optional(),
  DEMO_MODE: booleanFromEnv.optional(),
  DEMO_ACCOUNT_ID: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid server environment variables:\n${issues}`);
}

export const env = parsed.data;

if (!env.DEMO_MODE) {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is required when DEMO_MODE is false.");
  }
  if (!env.ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY is required when DEMO_MODE is false.");
  }
}
