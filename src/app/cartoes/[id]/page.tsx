import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { ChevronLeft, ChevronRight, Coffee, Pencil } from "lucide-react";
import { db } from "@/db";
import { cartoes, comprasCartao } from "@/db/schema";
import {
  excluirCartao,
  excluirCompraCartao,
  salvarCartao,
  salvarCompraCartao,
} from "@/lib/acoes";
import { cicloDoCartao, nomeMes, parcelasDaCompra, somarMeses } from "@/lib/faturas";
import { formatarCentavos } from "@/lib/moeda";
import { formatarDataCurta, hojeISO, mesAtualISO } from "@/lib/datas";
import Topbar from "@/components/Topbar";
import FolhaAdicionar from "@/components/FolhaAdicionar";
import LinhaComEdicao from "@/components/LinhaComEdicao";
import BotaoExcluir from "@/components/BotaoExcluir";
import BotaoExcluirCartao from "@/components/BotaoExcluirCartao";
import { CamposCartao, CamposCompra } from "@/components/campos";

export const dynamic = "force-dynamic";

export default async function PaginaFatura({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mes?: string }>;
}) {
  const { id } = await params;
  const cartaoId = Number(id);
  if (!Number.isInteger(cartaoId)) notFound();

  const [cartao] = await db
    .select()
    .from(cartoes)
    .where(eq(cartoes.id, cartaoId));
  if (!cartao) notFound();

  const { mes: mesParam } = await searchParams;
  const mesAtual = mesAtualISO();
  const mes = /^\d{4}-\d{2}$/.test(mesParam ?? "")
    ? (mesParam as string)
    : mesAtual;

  const compras = await db
    .select()
    .from(comprasCartao)
    .where(eq(comprasCartao.cartaoId, cartaoId))
    .orderBy(desc(comprasCartao.data), desc(comprasCartao.id));

  const comprasPorId = new Map(compras.map((c) => [c.id, c]));
  const horizonte = mes > mesAtual ? mes : mesAtual;
  const parcelas = compras.flatMap((c) =>
    parcelasDaCompra(c, cartao, horizonte),
  );
  const itensDaFatura = parcelas.filter((p) => p.mesPagamento === mes);
  const totalFatura = itensDaFatura.reduce((s, p) => s + p.valorCentavos, 0);
  /* Comprometido: parcelas futuras inteiras; assinatura pesa uma ocorrência
     (o ciclo corrente), como o banco segura o limite. */
  const comprometido = parcelas
    .filter((p) =>
      p.recorrente ? p.mesPagamento === mesAtual : p.mesPagamento >= mesAtual,
    )
    .reduce((s, p) => s + p.valorCentavos, 0);
  const { fechamento, vencimento } = cicloDoCartao(cartao);

  return (
    <div className="page">
      <Topbar
        titulo={cartao.nome}
        subtitulo={[cartao.bandeira, `Fecha dia ${fechamento} · vence dia ${vencimento}`]
          .filter(Boolean)
          .join(" · ")}
      />

      <div className="agenda-head">
        <Link
          className="agenda-nav"
          href={`/cartoes/${cartaoId}?mes=${somarMeses(mes, -1)}`}
          aria-label="Fatura anterior"
        >
          <span className="ic">
            <ChevronLeft />
          </span>
        </Link>
        <span className="agenda-month">Fatura {nomeMes(mes)}</span>
        <Link
          className="agenda-nav"
          href={`/cartoes/${cartaoId}?mes=${somarMeses(mes, 1)}`}
          aria-label="Próxima fatura"
        >
          <span className="ic">
            <ChevronRight />
          </span>
        </Link>
      </div>

      <div className="card card-solo" style={{ marginTop: 8 }}>
        <div className="saldo-hero">
          <span className="num">{formatarCentavos(totalFatura)}</span>
          <span className="lbl">
            Total da fatura · {itensDaFatura.length}{" "}
            {itensDaFatura.length === 1 ? "lançamento" : "lançamentos"}
          </span>
        </div>
        <div className="kv">
          <span className="k">Comprometido nas próximas faturas</span>
          <span className="v">{formatarCentavos(comprometido)}</span>
        </div>
        {cartao.limiteCentavos ? (
          <div className="kv">
            <span className="k">Limite disponível</span>
            <span
              className={`v${cartao.limiteCentavos - comprometido < 0 ? " bad" : " ok"}`}
            >
              {formatarCentavos(cartao.limiteCentavos - comprometido)}
              {" de "}
              {formatarCentavos(cartao.limiteCentavos)}
            </span>
          </div>
        ) : null}
      </div>

      <div className="section-label">
        <span>Lançamentos da fatura</span>
      </div>

      {itensDaFatura.length === 0 ? (
        <div className="card">
          <div className="empty-line">
            <span className="ic">
              <Coffee />
            </span>
            Nenhum lançamento nesta fatura.
          </div>
        </div>
      ) : (
        <div className="agenda-list">
          {itensDaFatura.map((p) => (
            <LinhaComEdicao
              key={`${p.compraId}-${p.numero}`}
              titulo={`Editar compra ${p.descricao}`}
              action={salvarCompraCartao}
              classeLinha="agenda-item"
              linha={
                <>
                  <span className="ai-body">
                    <span className="ai-title">{p.descricao}</span>
                    <span className="ai-sub">
                      {p.recorrente ? (
                        <span className="chip ok">Assinatura</span>
                      ) : p.totalParcelas > 1 ? (
                        <span className="chip">
                          Parcela {p.numero}/{p.totalParcelas}
                        </span>
                      ) : (
                        <span className="chip">À vista</span>
                      )}
                      <span className="chip">{p.categoria}</span>
                      <span>
                        {p.recorrente
                          ? `Desde ${formatarDataCurta(p.dataCompra)}`
                          : `Compra em ${formatarDataCurta(p.dataCompra)}`}
                      </span>
                    </span>
                  </span>
                  <span className="ai-valor">
                    {formatarCentavos(p.valorCentavos)}
                  </span>
                  <BotaoExcluir
                    id={p.compraId}
                    action={excluirCompraCartao}
                    rotulo={`Excluir compra ${p.descricao} (todas as parcelas)`}
                  />
                </>
              }
              campos={
                <CamposCompra
                  cartaoId={cartao.id}
                  atual={comprasPorId.get(p.compraId)}
                  dataPadrao={hojeISO()}
                />
              }
            />
          ))}
        </div>
      )}

      <div className="section-label">
        <span>Cartão</span>
      </div>
      <div className="card">
        <LinhaComEdicao
          titulo={`Editar ${cartao.nome}`}
          action={salvarCartao}
          linha={
            <>
              <span className="ic">
                <Pencil />
              </span>
              <span className="row-label">
                Editar dados do cartão
                <span className="row-sub-label">
                  Limite, bandeira, fechamento e vencimento
                </span>
              </span>
              <span className="ic chev">
                <ChevronRight />
              </span>
            </>
          }
          campos={<CamposCartao atual={cartao} />}
        />
        <BotaoExcluirCartao id={cartao.id} action={excluirCartao} />
      </div>

      <div className="page-end" />

      <FolhaAdicionar
        titulo={`Nova compra no ${cartao.nome}`}
        rotulo="Adicionar compra"
        action={salvarCompraCartao}
        permitirContinuar
      >
        <CamposCompra cartaoId={cartao.id} dataPadrao={hojeISO()} />
      </FolhaAdicionar>
    </div>
  );
}
