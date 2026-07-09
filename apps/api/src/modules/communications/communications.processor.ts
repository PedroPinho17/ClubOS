import { CommunicationStatus } from '@clubos/database';
import type { MailService } from '../../core/mail/mail.service';
import { communicationEmail } from '../../core/mail/templates/communication';
import type { PrismaService } from '../../prisma/prisma.service';
import type { CommunicationJobData } from './communications.queue';

export interface CommunicationWorkerDeps {
  mail: Pick<MailService, 'send'>;
  prisma: Pick<PrismaService, 'communication'>;
  branding?: { name: string; primaryColor?: string | null; logoUrl?: string | null };
}

/** Logica de processamento do job de comunicacao (testavel sem BullMQ). */
export async function processCommunicationJob(
  deps: CommunicationWorkerDeps,
  data: CommunicationJobData,
): Promise<void> {
  const { communicationId, email, memberName, subject, body } = data;
  const branding = deps.branding ?? { name: 'ClubOS' };
  const rendered = communicationEmail({ branding, memberName, subject, body });

  try {
    await deps.mail.send({
      to: email,
      subject,
      text: rendered.text,
      html: rendered.html,
    });
    await bumpCommunicationCount(deps.prisma, communicationId, 'sentCount');
  } catch {
    await bumpCommunicationCount(deps.prisma, communicationId, 'failedCount');
    throw new Error('Falha no envio');
  }
}

async function bumpCommunicationCount(
  prisma: Pick<PrismaService, 'communication'>,
  id: string,
  field: 'sentCount' | 'failedCount',
): Promise<void> {
  const comm = await prisma.communication.update({
    where: { id },
    data: { [field]: { increment: 1 }, status: CommunicationStatus.SENDING },
  });
  if (comm.sentCount + comm.failedCount >= comm.totalRecipients) {
    await prisma.communication.update({
      where: { id },
      data: {
        status:
          comm.failedCount > 0 && comm.sentCount === 0
            ? CommunicationStatus.FAILED
            : CommunicationStatus.SENT,
      },
    });
  }
}
