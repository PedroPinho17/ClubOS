import { describe, expect, it } from 'vitest';
import { communicationEmail } from './communication';
import { portalAccessEmail } from './portal-access';
import { quotaDueSoonEmail } from './quota-due-soon';
import { quotaOverdueEmail } from './quota-overdue';

const branding = { name: 'CRC Vale', primaryColor: '#1d4ed8' };

describe('mail templates', () => {
  it('quota due soon inclui HTML e texto', () => {
    const email = quotaDueSoonEmail({
      branding,
      memberName: 'Joao Silva',
      days: 5,
      dueDate: '15/07/2026',
      portalUrl: 'http://localhost:3000/portal',
    });
    expect(email.html).toContain('Joao Silva');
    expect(email.html).toContain('CRC Vale');
    expect(email.html).toContain('5 dia(s)');
    expect(email.text).toContain('Joao Silva');
    expect(email.text).toContain('portal');
  });

  it('quota overdue inclui aviso de atraso', () => {
    const email = quotaOverdueEmail({
      branding,
      memberName: 'Maria',
      days: 3,
      dueDate: '01/07/2026',
      portalUrl: 'http://localhost:3000/portal',
    });
    expect(email.html).toContain('em atraso');
    expect(email.text).toContain('Maria');
  });

  it('portal access inclui credenciais', () => {
    const email = portalAccessEmail({
      branding,
      memberName: 'Joao',
      email: 'joao@example.com',
      tempPassword: 'Temp123!',
      loginUrl: 'http://localhost:3000/login',
    });
    expect(email.html).toContain('joao@example.com');
    expect(email.html).toContain('Temp123!');
    expect(email.text).toContain('Password temporária');
  });

  it('communication preserva quebras de linha', () => {
    const email = communicationEmail({
      branding,
      memberName: 'Pedro',
      subject: 'Aviso geral',
      body: 'Linha 1\nLinha 2',
    });
    expect(email.html).toContain('Linha 1<br/>Linha 2');
    expect(email.text).toContain('Linha 1');
  });
});
