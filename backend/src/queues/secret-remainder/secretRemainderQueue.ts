import Queue from "bull";
import { sendMail } from "../../helpers";

export const secretRemainderQueue = new Queue<addQueueParams>(
  "secret-remainder-queue",
  process.env.REDIS_URL as string
);

interface addToSecretRemainderQueueParams {
  id: string;
  cron: string;
  note: string;
  mailsToSend: string[];
  secretName: string;
}

type addQueueParams = Omit<addToSecretRemainderQueueParams, "id" | "cron">;

secretRemainderQueue.process(async (job) => {
  const { mailsToSend, note, secretName } = job.data;

  await sendMail({
    template: "emailRemainder.handlebars",
    recipients: mailsToSend,
    subjectLine: `Infisical secret remainder for ${secretName}`,
    substitutions: {
      note,
      secretName
    }
  });
});

export const deleteFromSecretRemainderQueue = async (id: string, cron: string) => {
  await secretRemainderQueue.removeRepeatable({
    cron,
    jobId: genJobId(id)
  });
};

const genJobId = (id: string) => `remainder-${id}`;

export const addToSecretRemainderQueue = async (jobDetails: addToSecretRemainderQueueParams) => {
  const { id, cron, ...rest } = jobDetails;

  await secretRemainderQueue.add(
    { ...rest },
    {
      repeat: {
        cron
      },
      jobId: genJobId(id)
    }
  );
};
