import { config as loadDotenv } from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env.test when NODE_ENV=test so the test suite never touches dev data,
// otherwise load the regular .env file.
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
loadDotenv({ path: path.resolve(__dirname, '../../', envFile) });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  FRONTEND_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  PASSWORD_RESET_TOKEN_TTL_MIN: z.coerce.number().int().positive().default(30),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = {
  nodeEnv: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  databaseUrl: parsed.data.DATABASE_URL,
  frontendUrl: parsed.data.FRONTEND_URL,
  jwt: {
    accessSecret: parsed.data.JWT_ACCESS_SECRET,
    refreshSecret: parsed.data.JWT_REFRESH_SECRET,
    accessExpiresIn: parsed.data.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: parsed.data.JWT_REFRESH_EXPIRES_IN,
  },
  passwordResetTokenTtlMin: parsed.data.PASSWORD_RESET_TOKEN_TTL_MIN,
  isProduction: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
} as const;

export type Env = typeof env;
