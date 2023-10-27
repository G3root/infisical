import * as z from "zod";
import { isValidCron } from "cron-validator";

const secretRemainderSchema = z.object({
  cron: z
    .string()
    .min(1)
    .trim()
    .refine((val) => isValidCron(val), "invalid cron expression"),
  note: z.string().trim()
});

export const CreateSecretRemainder = z.object({
  body: z.object({
    workspaceId: z.string().trim(),
    environment: z.string().trim(),
    secretPath: z.string().trim().default("/"),
    secretRemainder: secretRemainderSchema
  }),
  params: z.object({
    secretName: z.string().trim()
  })
});

export const DeleteSecretRemainder = z.object({
  body: z.object({
    workspaceId: z.string().trim(),
    environment: z.string().trim(),
    secretPath: z.string().trim().default("/")
  }),
  params: z.object({
    secretName: z.string().trim()
  })
});

export const UpdateSecretRemainder = z.object({
  body: z.object({
    workspaceId: z.string().trim(),
    environment: z.string().trim(),
    secretPath: z.string().trim().default("/"),
    secretRemainder: secretRemainderSchema
      .partial()
      .refine(({ cron, note }) => cron !== undefined || note !== undefined, {
        message: "One of the fields must be defined"
      })
  }),
  params: z.object({
    secretName: z.string().trim()
  })
});
