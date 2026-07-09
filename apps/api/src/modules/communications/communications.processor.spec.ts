import { CommunicationStatus } from '@clubos/database';
import { describe, expect, it, vi } from 'vitest';
import { processCommunicationJob } from './communications.processor';

describe('processCommunicationJob', () => {
  it('envia email e incrementa sentCount', async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const communication = {
      update: vi
        .fn()
        .mockResolvedValueOnce({
          id: 'comm-1',
          sentCount: 1,
          failedCount: 0,
          totalRecipients: 1,
        })
        .mockResolvedValueOnce({ id: 'comm-1', status: CommunicationStatus.SENT }),
    };

    await processCommunicationJob(
      {
        mail: { send },
        prisma: { communication } as never,
        branding: { name: 'CRC Vale' },
      },
      {
        communicationId: 'comm-1',
        organizationId: 'org-1',
        email: 'joao@example.com',
        memberName: 'Joao',
        subject: 'Aviso',
        body: 'Ola',
      },
    );

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'joao@example.com',
        html: expect.stringContaining('Joao'),
      }),
    );
    expect(communication.update).toHaveBeenCalledTimes(2);
  });

  it('incrementa failedCount quando envio falha', async () => {
    const send = vi.fn().mockRejectedValue(new Error('smtp down'));
    const communication = {
      update: vi.fn().mockResolvedValue({
        id: 'comm-2',
        sentCount: 0,
        failedCount: 1,
        totalRecipients: 1,
      }),
    };

    await expect(
      processCommunicationJob(
        { mail: { send }, prisma: { communication } as never },
        {
          communicationId: 'comm-2',
          organizationId: 'org-1',
          email: 'x@test.pt',
          memberName: 'X',
          subject: 'S',
          body: 'B',
        },
      ),
    ).rejects.toThrow(/falha no envio/i);

    expect(communication.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'comm-2' },
        data: expect.objectContaining({ failedCount: { increment: 1 } }),
      }),
    );
  });
});
