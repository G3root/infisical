import * as z from "zod";

export const CreateSecretRemainder = z.object({
  body: z.object({
    workspaceId: z.string().trim(),
    environment: z.string().trim(),
    secretPath: z.string().trim().default("/"),
    secretRemainder: z.object({
      cron: z.string().trim(),
      note: z.string().trim()
    })
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
