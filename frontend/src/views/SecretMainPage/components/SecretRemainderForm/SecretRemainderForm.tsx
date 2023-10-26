import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  cron: z.string().min(1),
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
    await deleteSecretRemainder({
      environment,
      secretName: secret.key,
      secretPath,
      workspaceId
    });

    onToggle(false);
  };

  return (
    <Modal isOpen onOpenChange={onToggle}>
      <ModalContent title="Create secret remainder">
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormControl
            label="Cron"
            isError={Boolean(errors?.cron)}
            errorText={errors?.cron?.message}
          >
            <Input {...register("cron")} defaultValue={secret?.secretRemainder?.cron} />
          </FormControl>

          <FormControl
            label="Note"
            isError={Boolean(errors?.note)}
            errorText={errors?.note?.message}
          >
            <TextArea {...register("note")} defaultValue={secret?.secretRemainder?.note} />
          </FormControl>

          <div className="flex items-center justify-end gap-x-2">
            {secret?.secretRemainder?.note && (
              <Button type="button" onClick={onDelete}>
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
