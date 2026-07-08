import Link from 'next/link';

export const metadata = {
  title: 'Acordo de tratamento de dados (DPA) — ClubOS',
  description: 'Modelo de acordo entre organizacao e operador da plataforma ClubOS.',
};

export default function DpaPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="mb-6 text-sm text-muted-foreground">
        <Link href="/login" className="underline hover:text-foreground">
          Voltar ao login
        </Link>
        {' · '}
        <Link href="/privacidade" className="underline hover:text-foreground">
          Politica de privacidade
        </Link>
      </p>

      <h1 className="mb-2 text-3xl font-bold">Acordo de tratamento de dados (DPA)</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Modelo informativo — julho de 2026. Nao substitui aconselhamento juridico.
      </p>

      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Partes</h2>
          <p>
            <strong className="text-foreground">Responsavel pelo tratamento:</strong> a associacao ou clube
            cliente que gere socios na plataforma.
          </p>
          <p className="mt-2">
            <strong className="text-foreground">Subcontratante:</strong> o fornecedor do software ClubOS que
            hospeda e opera a aplicacao em nome do cliente.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Objeto e duracao</h2>
          <p>
            O subcontratante trata dados pessoais apenas para prestar o servico SaaS (gestao de socios,
            quotas, comunicacoes e portal), durante a vigencia do contrato de servico e nos prazos legais de
            conservacao acordados.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Obrigacoes do subcontratante</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Tratar dados apenas segundo instrucoes documentadas do responsavel.</li>
            <li>Garantir confidencialidade das pessoas autorizadas a tratar dados.</li>
            <li>Implementar medidas tecnicas e organizativas adequadas (acesso, auditoria, backups).</li>
            <li>Assistir o responsavel no cumprimento de direitos dos titulares (export e apagamento RGPD).</li>
            <li>Notificar violacoes de dados sem demora injustificada apos tomada de conhecimento.</li>
            <li>Eliminar ou devolver dados ao termino do contrato, salvo obrigacao legal de conservacao.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Subcontratacao adicional</h2>
          <p>
            O responsavel autoriza o uso de infraestrutura de computacao, bases de dados, email e
            armazenamento de ficheiros, desde que estes cumpram obrigacoes equivalentes ao presente acordo.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Localizacao dos dados</h2>
          <p>
            Os dados devem ser alojados no Espaco Economico Europeu ou em jurisdicoes com garantias adequadas
            (clausulas contratuais-tipo ou decisao de adequacao), conforme configuracao acordada em contrato
            comercial.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Auditoria</h2>
          <p>
            O responsavel pode solicitar informacao sobre medidas de seguranca e registos de tratamento
            relevantes, mediante aviso razoavel e sem comprometer a seguranca de outros clientes.
          </p>
        </section>
      </div>
    </div>
  );
}
