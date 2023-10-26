type BaseDto = {
  secretPath?: string;
  workspaceId: string;
  environment: string;
  secretName: string;
};

export type TCreateSecretRemainderDTO = BaseDto & {
  secretRemainder: {
    cron: string;
    note: string;
  };
};

export type TDeleteSecretRemainderDTO = BaseDto;

export type TUpdateSecretRemainderDTO = BaseDto & {
  secretRemainder: {
    cron?: string;
    note?: string;
  };
};
