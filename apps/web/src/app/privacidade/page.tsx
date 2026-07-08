import Link from 'next/link';

export const metadata = {
  title: 'Politica de privacidade — ClubOS',
  description: 'Informacao sobre tratamento de dados pessoais na plataforma ClubOS.',
};

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="mb-6 text-sm text-muted-foreground">
        <Link href="/login" className="underline hover:text-foreground">
          Voltar ao login
        </Link>
      </p>

      <h1 className="mb-2 text-3xl font-bold">Politica de privacidade</h1>
      <p className="mb-8 text-sm text-muted-foreground">Ultima atualizacao: julho de 2026</p>

      <div className="prose prose-sm max-w-none space-y-6 text-foreground">
        <section>
          <h2 className="text-lg font-semibold">1. Responsavel pelo tratamento</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Cada associacao ou clube que utiliza o ClubOS e responsavel pelo tratamento dos dados dos seus
            socios e utilizadores internos. O operador da plataforma (fornecedor do software) atua como
            subcontratante de tratamento quando aplicavel, nos termos acordados com cada organizacao.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. Dados tratados</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Podem ser tratados: identificacao e contacto (nome, email, telefone), numero de socio, fotografia,
            plano e historico de quotas/pagamentos, notas administrativas, registos de auditoria e dados de
            autenticacao (sessao, passkey opcional).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. Finalidades e base legal</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Gestao de socios e quotas — execucao de contrato / interesse legitimo da associacao.</li>
            <li>Comunicacoes e lembretes — consentimento ou interesse legitimo, conforme o caso.</li>
            <li>Seguranca e auditoria — interesse legitimo e obrigacoes legais.</li>
            <li>Obrigacoes contabilisticas — conservacao de registos de pagamento quando exigido por lei.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. Conservacao</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Os dados sao conservados enquanto durar a relacao com a associacao e pelo periodo necessario
            para cumprimento de obrigacoes legais. Apos pedido de apagamento (RGPD), os dados identificativos
            do socio sao anonimizados; os registos de pagamento podem ser mantidos de forma dissociada para
            fins contabilisticos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. Direitos dos titulares</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Os titulares podem exercer os direitos de acesso, retificacao, apagamento, limitacao, oposicao e
            portabilidade junto da associacao responsavel. Os administradores da organizacao podem exportar
            dados (export RGPD) e solicitar anonimizacao na area de Membros. Reclamacoes podem ser
            apresentadas a CNPD (www.cnpd.pt).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. Subcontratantes e transferencias</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A infraestrutura pode incluir alojamento, email (SMTP), armazenamento de ficheiros (S3-compativel)
            e base de dados. As organizacoes devem garantir contratos adequados (ver modelo DPA em{' '}
            <Link href="/dpa" className="underline">
              /dpa
            </Link>
            ).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. Seguranca</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Aplicam-se controlos de acesso por perfil, auditoria de acoes sensiveis, rate limiting em
            autenticacao e validacao publica, e comunicacao cifrada (HTTPS) em producao.
          </p>
        </section>
      </div>
    </div>
  );
}
