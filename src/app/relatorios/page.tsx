import Link from "next/link";
import { desc, like } from "drizzle-orm";
import { ChevronLeft, ChevronRight, Coffee } from "lucide-react";
import { db } from "@/db";
import { custosVariaveis } from "@/db/schema";
import { CATEGORIAS_VARIAVEIS } from "@/lib/categorias";
import { formatarCentavos } from "@/lib/moeda";
import { mesAtualISO } from "@/lib/datas";
import { nomeMes, somarMeses } from "@/lib/faturas";
import Topbar from "@/components/Topbar";

export const dynamic = "force-dynamic";

export default async function PaginaRelatorios({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes: mesParam } = await searchParams;
  const mesAtual = mesAtualISO();
  const mes = /^\d{4}-\d{2}$/.test(mesParam ?? "")
    ? (mesParam as string)
    : mesAtual;

  const lista = await db
    .select()
    .from(custosVariaveis)
    .where(like(custosVariaveis.data, `${mes}%`))
    .orderBy(desc(custosVariaveis.data), desc(custosVariaveis.id));

  const total = lista.reduce((s, c) => s + c.valorCentavos, 0);

  const porCategoria = new Map<string, typeof lista>();
  for (const item of lista) {
    const cat = item.categoria;
    if (!porCategoria.has(cat)) porCategoria.set(cat, []);
    porCategoria.get(cat)!.push(item);
  }

  const categoriasOrdenadas = [
    ...CATEGORIAS_VARIAVEIS.filter((cat) => porCategoria.has(cat)),
    ...[...porCategoria.keys()]
      .filter((cat) => !CATEGORIAS_VARIAVEIS.includes(cat as typeof CATEGORIAS_VARIAVEIS[number]))
      .sort(),
  ];

  return (
    <div className="page">
      <Topbar titulo="Relatórios" subtitulo={`${nomeMes(mes)}`} />

      <div className="agenda-head">
        <Link
          className="agenda-nav"
          href={`/relatorios?mes=${somarMeses(mes, -1)}`}
          aria-label="Mês anterior"
        >
          <span className="ic">
            <ChevronLeft />
          </span>
        </Link>
        <span className="agenda-month">{nomeMes(mes)}</span>
        <Link
          className="agenda-nav"
          href={`/relatorios?mes=${somarMeses(mes, 1)}`}
          aria-label="Próximo mês"
        >
          <span className="ic">
            <ChevronRight />
          </span>
        </Link>
      </div>

      <div className="card">
        <div className="saldo-hero">
          <span className="num">
            {formatarCentavos(total)}
          </span>
          <span className="lbl">
            Total em gastos variáveis · {lista.length}{" "}
            {lista.length === 1 ? "lançamento" : "lançamentos"}
          </span>
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="empty-line">
            <span className="ic">
              <Coffee />
            </span>
            Nenhum lançamento neste mês.
          </div>
        </div>
      ) : (
        <>
          <div className="section-label">
            <span>Por categoria</span>
          </div>

          {categoriasOrdenadas.map((cat) => {
            const itens = porCategoria.get(cat)!;
            const catTotal = itens.reduce((s, c) => s + c.valorCentavos, 0);
            const pct = total > 0 ? Math.round((catTotal / total) * 100) : 0;
            return (
              <details className="card report-cat" key={cat}>
                <summary className="kv report-cat-header">
                  <span className="k">{cat}</span>
                  <span className="v">
                    {formatarCentavos(catTotal)}
                    <span style={{ fontWeight: 600, opacity: 0.5, marginLeft: 6 }}>
                      {pct}%
                    </span>
                  </span>
                </summary>
                {itens.map((item) => (
                  <div className="kv" key={item.id}>
                    <span className="k">
                      {item.descricao}
                      <span
                        style={{
                          display: "block",
                          fontSize: 12,
                          fontWeight: 500,
                          color: "var(--text-soft)",
                          marginTop: 2,
                        }}
                      >
                        {item.data.slice(8, 10)}/{item.data.slice(5, 7)}
                      </span>
                    </span>
                    <span className="v">{formatarCentavos(item.valorCentavos)}</span>
                  </div>
                ))}
              </details>
            );
          })}
        </>
      )}

      <div className="page-end" />
    </div>
  );
}
