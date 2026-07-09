import { describe, expect, it, vi } from 'vitest';
import { processReceiptJob } from './receipt.worker';

describe('processReceiptJob', () => {
  it('gera PDF, cacheia e envia email quando socio tem email', async () => {
    const buffer = Buffer.from('pdf');
    const generateReceipt = vi.fn().mockResolvedValue({ filename: 'recibo.pdf', buffer });
    const cacheReceipt = vi.fn().mockResolvedValue(undefined);
    const findOne = vi.fn().mockResolvedValue({
      id: 'pay-1',
      amount: 10,
      member: { name: 'Joao Silva', email: 'joao@example.com' },
      organization: { name: 'CRC Vale', primaryColor: '#1d4ed8', logoUrl: null },
    });
    const send = vi.fn().mockResolvedValue(undefined);

    await processReceiptJob(
      { payments: { generateReceipt, cacheReceipt, findOne }, mail: { send } },
      { organizationId: 'org-1', paymentId: 'pay-1' },
    );

    expect(generateReceipt).toHaveBeenCalledWith('org-1', 'pay-1');
    expect(cacheReceipt).toHaveBeenCalledWith('pay-1', buffer);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'joao@example.com',
        html: expect.stringContaining('Joao Silva'),
        attachments: [{ filename: 'recibo.pdf', content: buffer, contentType: 'application/pdf' }],
      }),
    );
  });

  it('nao envia email quando socio nao tem email', async () => {
    const send = vi.fn();
    await processReceiptJob(
      {
        payments: {
          generateReceipt: vi.fn().mockResolvedValue({ filename: 'r.pdf', buffer: Buffer.from('x') }),
          cacheReceipt: vi.fn(),
          findOne: vi.fn().mockResolvedValue({
            amount: 10,
            member: { name: 'Sem Email', email: null },
            organization: { name: 'CRC Vale', primaryColor: null, logoUrl: null },
          }),
        },
        mail: { send },
        logger: { warn: vi.fn() },
      },
      { organizationId: 'org-1', paymentId: 'pay-2' },
    );
    expect(send).not.toHaveBeenCalled();
  });
});
