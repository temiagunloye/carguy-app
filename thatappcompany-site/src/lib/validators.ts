import { z } from "zod";

export const SubscribeSchema = z.object({
    email: z.string().email(),
    source: z.string().optional()
});

export type SubscribeInput = z.infer<typeof SubscribeSchema>;
