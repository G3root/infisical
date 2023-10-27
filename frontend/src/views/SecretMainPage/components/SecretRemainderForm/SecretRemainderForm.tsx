import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isValidCron } from "cron-validator";
import { z } from "zod";

import { useNotificationContext } from "@app/components/context/Notifications/NotificationProvider";
import { Button, FormControl, Input, Modal, ModalContent, TextArea } from "@app/components/v2";
import {
  useCreateSecretRemainder,
  useDeleteSecretRemainder,
  useUpdateSecretRemainder
} from "@app/hooks/api/secretRemainder/mutations";
import { DecryptedSecret } from "@app/hooks/api/types";

const formSchema = z.object({
  cron: z
    .string()
    .min(1)
    .refine((val) => isValidCron(val), "invalid cron expression"),
  note: z.string().min(1)
});

type TFormSchema = z.infer<typeof formSchema>;

interface SecretRemainderFormProps {
  onToggle: (isOpen: boolean) => void;
  secret: DecryptedSecret;
  secretPath: string;
  workspaceId: string;
  environment: string;
}

export const SecretRemainderForm = ({
  onToggle,
  secret,
  secretPath,
  workspaceId,
  environment
}: SecretRemainderFormProps) => {
  const { createNotification } = useNotificationContext();
  const { mutateAsync: createSecretRemainder } = useCreateSecretRemainder();
  const { mutateAsync: deleteSecretRemainder } = useDeleteSecretRemainder();
  const { mutateAsync: updateSecretReminder } = useUpdateSecretRemainder();

  const {
    formState: { errors },
    register,
    handleSubmit
  } = useForm<TFormSchema>({
    resolver: zodResolver(formSchema)
  });

  const onSubmit = async (data: TFormSchema) => {
    const isEditMode = !!secret?.secretRemainder;

    const action = isEditMode ? updateSecretReminder : createSecretRemainder;
    const actionMessage = `secret remainder ${isEditMode ? "updated" : "created"} successfully`;

    try {
      await action({
        environment,
        secretName: secret.key,
        secretPath,
        secretRemainder: data,
        workspaceId
      });
      createNotification({
        text: actionMessage,
        type: "success"
      });
    } catch (error) {
      createNotification({
        text: "an error occurred",
        type: "error"
      });
    }

    onToggle(false);
  };

  const onDelete = async () => {
    try {
      await deleteSecretRemainder({
        environment,
        secretName: secret.key,
        secretPath,
        workspaceId
      });
      createNotification({
        text: "remainder deleted successfully",
        type: "success"
      });
    } catch (error) {
      createNotification({
        text: "an error occurred",
        type: "error"
      });
    }

    onToggle(false);
  };

  return (
    <Modal isOpen onOpenChange={onToggle}>
      <ModalContent title="Create secret remainder">
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormControl
            isRequired
            label="Cron Expression"
            isError={Boolean(errors?.cron)}
            errorText={errors?.cron?.message}
            helperText={
              <>
                Enter a cron expression to schedule a secret remainder. Learn more about cron syntax{" "}
                <a
                  className="underline underline-offset-1"
                  href="https://crontab.guru/examples.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  here
                </a>
                .
              </>
            }
          >
            <Input {...register("cron")} defaultValue={secret?.secretRemainder?.cron} />
          </FormControl>

          <FormControl
            isRequired
            label="Note"
            isError={Boolean(errors?.note)}
            errorText={errors?.note?.message}
          >
            <TextArea {...register("note")} defaultValue={secret?.secretRemainder?.note} />
          </FormControl>

          <div className="flex items-center justify-end gap-x-2">
            {secret?.secretRemainder?.note && (
              <Button colorSchema="danger" type="button" onClick={onDelete}>
                Delete
              </Button>
            )}

            <Button type="submit">Save</Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
};
