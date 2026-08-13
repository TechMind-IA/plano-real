import Link from "next/link";
import { asc } from "drizzle-orm";
import { ChevronRight, Coffee, CreditCard } from "lucide-react";
import { db } from "@/db";
import { cartoes, comprasCartao } from "@/db/schema";
import { salvarCartao } from "@/lib/acoes";
import { formatarCentavos } from "@/lib/moeda";
import { mesAtualISO } from "@/lib/datas";
import { nomeMes, somarMeses, todasAsParcelas } from "@/lib/faturas";
import Topbar from "@/components/Topbar";
import FolhaAdicionar from "@/components/FolhaAdicionar";
import { CamposCartao } from "@/components/campos";

export const dynamic = "force-dynamic";

export default async function PaginaCartoes() {
  const [lista, compras] = await Promise.all([
    db.select().from(cartoes).orderBy(asc(cartoes.nome)),
    db.select().from(comprasCartao),
  ]);

  const mesAtual = mesAtualISO();
  const cartoesPorId = new Map(lista.map((c) => [c.id, c]));
  const parcelas = todasAsParcelas(compras, cartoesPorId, somarMeses(mesAtual, 5));

  const faturaDoMes = (cartaoId: number, mes: string) =>
    parcelas
      .filter((p) => p.cartaoId === cartaoId && p.mesPagamento === mes)
      .reduce((s, p) => s + p.valorCentavos, 0);

  /* Próximas faturas somadas de todos os cartões (mês atual + 5). */
  const proximosMeses = Array.from({ length: 6 }, (_, i) =>
    somarMeses(mesAtual, i),
  );

  return (
    <div className="page">
      <Topbar
        titulo="Cartões de crédito"
        subtitulo={`${lista.length} ${lista.length === 1 ? "cartão cadastrado" : "cartões cadastrados"}`}
      />

      <div className="section-label">
        <span>Seus cartões</span>
      </div>
      <div className="card">
        {lista.length === 0 ? (
          <div className="empty-line">
            <span className="ic">
              <Coffee />
            </span>
            Nenhum cartão cadastrado.
          </div>
        ) : (
          lista.map((c) => (
            <Link key={c.id} href={`/cartoes/${c.id}`} className="row">
              <span className="ic">
                <CreditCard />
              </span>
              <span className="row-label">
                {c.nome}
                <span className="row-sub-label">
                  {[
                    c.bandeira,
                    c.diaFechamento ? `Fecha dia ${c.diaFechamento}` : null,
                    c.diaVencimento ? `Vence dia ${c.diaVencimento}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              <span className="row-hint">
                Fatura do mês
                <br />
                {formatarCentavos(faturaDoMes(c.id, mesAtual))}
              </span>
              <span className="ic chev">
                <ChevronRight />
              </span>
            </Link>
          ))
        )}
      </div>

      {parcelas.length > 0 ? (
        <>
          <div className="section-label">
            <span>Próximas faturas · todos os cartões</span>
          </div>
          <div className="card">
            {proximosMeses.map((mes) => {
              const total = parcelas
                .filter((p) => p.mesPagamento === mes)
                .reduce((s, p) => s + p.valorCentavos, 0);
              return (
                <div key={mes} className="kv">
                  <span className="k" style={{ textTransform: "capitalize" }}>
                    {nomeMes(mes)}
                  </span>
                  <span className="v">{formatarCentavos(total)}</span>
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      <div className="page-end" />

      <FolhaAdicionar
        titulo="Novo cartão"
        rotulo="Adicionar cartão"
        action={salvarCartao}
      >
        <CamposCartao />
      </FolhaAdicionar>
    </div>
  );
}
