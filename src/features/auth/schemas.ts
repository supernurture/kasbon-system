import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.email("Email-nya kayaknya belum bener.").max(254, "Email-nya kepanjangan."),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter ya.")
    .max(72, "Password maksimal 72 karakter."),
});

export type Credentials = z.infer<typeof credentialsSchema>;

export type AuthResult = { error: string } | { notice: string };
