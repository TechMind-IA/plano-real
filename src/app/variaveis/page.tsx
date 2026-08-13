import { desc, like } from "drizzle-orm";
import { Coffee, ShoppingCart } from "lucide-react";
import { db } from "@/db";
import { cartoes, custosVariaveis } from "@/db/schema";
import { excluirCustoVariavel, salvarCustoVariavel } from "@/lib/acoes";
import { formatarCentavos } from "@/lib/moeda";
import { formatarDataCurta, hojeISO, mesAtualISO, nomeMesAtual } from "@/lib/datas";
import Topbar from "@/components/Topbar";
import FolhaAdicionar from "@/components/FolhaAdicionar";
import LinhaComEdicao from "@/components/LinhaComEdicao";
import BotaoExcluir from "@/components/BotaoExcluir";
import { CamposGasto } from "@/components/campos";

export const dynamic = "force-dynamic";

export default async function PaginaVariaveis() {
  const [lista, listaCartoes] = await Promise.all([
    db
      .select()
      .from(custosVariaveis)
      .where(like(custosVariaveis.data, `${mesAtualISO()}%`))
      .orderBy(desc(custosVariaveis.data), desc(custosVariaveis.id)),
    db.select().from(cartoes),
  ]);

  const total = lista.reduce((s, c) => s + c.valorCentavos, 0);
  const nomeCartao = new Map(listaCartoes.map((c) => [c.id, c.nome]));

  return (
    <div className="page">
      <Topbar
        titulo="Custos variáveis"
        subtitulo={`${formatarCentavos(total)} em ${nomeMesAtual()}`}
      />

      <div className="section-label">
        <span>Lançamentos do mês</span>
      </div>
      <div className="card">
        {lista.length === 0 ? (
          <div className="empty-line">
            <span className="ic">
              <Coffee />
            </span>
            Nenhum lançamento neste mês.
          </div>
        ) : (
          lista.map((c) => (
            <LinhaComEdicao
              key={c.id}
              titulo={`Editar ${c.descricao}`}
              action={salvarCustoVariavel}
              linha={
                <>
                  <span className="ic">
                    <ShoppingCart />
                  </span>
                  <span className="row-label">
                    {c.descricao}
                    <span className="row-sub-label">
                      {formatarDataCurta(c.data)} · {c.categoria}
                      {c.cartaoId && nomeCartao.has(c.cartaoId)
                        ? ` · ${nomeCartao.get(c.cartaoId)}`
                        : ""}
                    </span>
                  </span>
                  <span className="row-valor">
                    {formatarCentavos(c.valorCentavos)}
                  </span>
                  <BotaoExcluir
                    id={c.id}
                    action={excluirCustoVariavel}
                    rotulo={`Excluir ${c.descricao}`}
                  />
                </>
              }
              campos={<CamposGasto atual={c} dataPadrao={hojeISO()} />}
            />
          ))
        )}
      </div>

      <div className="page-end" />

      <FolhaAdicionar
        titulo="Novo custo variável"
        rotulo="Adicionar lançamento"
        action={salvarCustoVariavel}
        permitirContinuar
      >
        <CamposGasto dataPadrao={hojeISO()} />
      </FolhaAdicionar>
    </div>
  );
}
