import type {
  Cartao,
  CompraCartao,
  CustoFixo,
  CustoVariavel,
  Renda,
} from "@/db/schema";
import {
  CATEGORIAS_FIXAS,
  CATEGORIAS_RENDA,
  CATEGORIAS_VARIAVEIS,
} from "@/lib/categorias";
import { centavosParaEntrada } from "@/lib/moeda";

/* Conjuntos de campos usados tanto na folha de criar (sem `atual`)
   quanto na de editar (com `atual` pré-preenchendo). Labels envolvem os
   inputs — sem htmlFor/id, que colidiriam entre as várias folhas da tela. */

export const BANDEIRAS = [
  "Visa",
  "Mastercard",
  "Elo",
  "American Express",
  "Hipercard",
  "Outra",
];

function CampoCategoria({
  opcoes,
  atual,
}: {
  opcoes: readonly string[];
  atual?: string;
}) {
  return (
    <label className="field">
      <span className="field-label">Categoria</span>
      <select name="categoria" className="field-input" defaultValue={atual}>
        {opcoes.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CamposRenda({
  atual,
  mesPadrao,
}: {
  atual?: Renda;
  mesPadrao: string;
}) {
  return (
    <>
      {atual ? <input type="hidden" name="id" value={atual.id} /> : null}
      <label className="field">
        <span className="field-label">Nome</span>
        <input
          name="nome"
          className="field-input"
          placeholder="Salário Montele, VR…"
          defaultValue={atual?.nome}
          required
        />
      </label>
      <div className="field-duo">
        <label className="field">
          <span className="field-label">Valor mensal</span>
          <input
            name="valor"
            className="field-input"
            inputMode="decimal"
            placeholder="0,00"
            defaultValue={atual ? centavosParaEntrada(atual.valorCentavos) : ""}
            required
          />
        </label>
        <label className="field">
          <span className="field-label">Dia do recebimento</span>
          <input
            name="diaRecebimento"
            className="field-input"
            type="number"
            min={1}
            max={31}
            placeholder="Ex.: 5"
            defaultValue={atual?.diaRecebimento ?? ""}
          />
        </label>
      </div>
      <CampoCategoria opcoes={CATEGORIAS_RENDA} atual={atual?.categoria} />
      <label className="field-check">
        <input
          type="checkbox"
          name="avulsa"
          defaultChecked={Boolean(atual?.mes)}
        />
        <span>Renda variável — vale só para o mês abaixo (hora extra…)</span>
      </label>
      <label className="field">
        <span className="field-label">Mês da renda variável</span>
        <input
          name="mes"
          className="field-input"
          type="month"
          defaultValue={atual?.mes ?? mesPadrao}
        />
      </label>
    </>
  );
}

export function CamposCustoFixo({ atual }: { atual?: CustoFixo }) {
  return (
    <>
      {atual ? <input type="hidden" name="id" value={atual.id} /> : null}
      <label className="field">
        <span className="field-label">Nome</span>
        <input
          name="nome"
          className="field-input"
          placeholder="Aluguel, internet, plano de saúde…"
          defaultValue={atual?.nome}
          required
        />
      </label>
      <div className="field-duo">
        <label className="field">
          <span className="field-label">Valor mensal</span>
          <input
            name="valor"
            className="field-input"
            inputMode="decimal"
            placeholder="0,00"
            defaultValue={atual ? centavosParaEntrada(atual.valorCentavos) : ""}
            required
          />
        </label>
        <label className="field">
          <span className="field-label">Dia do vencimento</span>
          <input
            name="diaVencimento"
            className="field-input"
            type="number"
            min={1}
            max={31}
            placeholder="Ex.: 5"
            defaultValue={atual?.diaVencimento ?? ""}
          />
        </label>
      </div>
      <CampoCategoria opcoes={CATEGORIAS_FIXAS} atual={atual?.categoria} />
    </>
  );
}

export function CamposGasto({
  atual,
  dataPadrao,
}: {
  atual?: CustoVariavel;
  dataPadrao: string;
}) {
  return (
    <>
      {atual ? <input type="hidden" name="id" value={atual.id} /> : null}
      <label className="field">
        <span className="field-label">Descrição</span>
        <input
          name="descricao"
          className="field-input"
          placeholder="Mercado, farmácia, restaurante…"
          defaultValue={atual?.descricao}
          required
        />
      </label>
      <div className="field-duo">
        <label className="field">
          <span className="field-label">Valor</span>
          <input
            name="valor"
            className="field-input"
            inputMode="decimal"
            placeholder="0,00"
            defaultValue={atual ? centavosParaEntrada(atual.valorCentavos) : ""}
            required
          />
        </label>
        <label className="field">
          <span className="field-label">Data</span>
          <input
            name="data"
            className="field-input"
            type="date"
            defaultValue={atual?.data ?? dataPadrao}
            required
          />
        </label>
      </div>
      <CampoCategoria opcoes={CATEGORIAS_VARIAVEIS} atual={atual?.categoria} />
    </>
  );
}

export function CamposCartao({ atual }: { atual?: Cartao }) {
  return (
    <>
      {atual ? <input type="hidden" name="id" value={atual.id} /> : null}
      <label className="field">
        <span className="field-label">Nome do cartão</span>
        <input
          name="nome"
          className="field-input"
          placeholder="Nubank, Itaú Click…"
          defaultValue={atual?.nome}
          required
        />
      </label>
      <div className="field-duo">
        <label className="field">
          <span className="field-label">Bandeira</span>
          <select
            name="bandeira"
            className="field-input"
            defaultValue={atual?.bandeira ?? undefined}
          >
            {BANDEIRAS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Limite</span>
          <input
            name="limite"
            className="field-input"
            inputMode="decimal"
            placeholder="0,00"
            defaultValue={
              atual?.limiteCentavos
                ? centavosParaEntrada(atual.limiteCentavos)
                : ""
            }
          />
        </label>
      </div>
      <div className="field-duo">
        <label className="field">
          <span className="field-label">Dia do fechamento</span>
          <input
            name="diaFechamento"
            className="field-input"
            type="number"
            min={1}
            max={31}
            placeholder="Ex.: 28"
            defaultValue={atual?.diaFechamento ?? ""}
          />
        </label>
        <label className="field">
          <span className="field-label">Dia do vencimento</span>
          <input
            name="diaVencimento"
            className="field-input"
            type="number"
            min={1}
            max={31}
            placeholder="Ex.: 5"
            defaultValue={atual?.diaVencimento ?? ""}
          />
        </label>
      </div>
    </>
  );
}

export function CamposCompra({
  cartaoId,
  atual,
  dataPadrao,
}: {
  cartaoId: number;
  atual?: CompraCartao;
  dataPadrao: string;
}) {
  return (
    <>
      {atual ? <input type="hidden" name="id" value={atual.id} /> : null}
      <input type="hidden" name="cartaoId" value={cartaoId} />
      <label className="field">
        <span className="field-label">Descrição</span>
        <input
          name="descricao"
          className="field-input"
          placeholder="Tênis, passagem, mercado…"
          defaultValue={atual?.descricao}
          required
        />
      </label>
      <div className="field-duo">
        <label className="field">
          <span className="field-label">Valor total</span>
          <input
            name="valor"
            className="field-input"
            inputMode="decimal"
            placeholder="0,00"
            defaultValue={
              atual ? centavosParaEntrada(atual.valorTotalCentavos) : ""
            }
            required
          />
        </label>
        <label className="field">
          <span className="field-label">Parcelas</span>
          <input
            name="parcelas"
            className="field-input"
            type="number"
            min={1}
            max={48}
            defaultValue={atual?.parcelas ?? 1}
            required
          />
        </label>
      </div>
      <div className="field-duo">
        <label className="field">
          <span className="field-label">Data da compra</span>
          <input
            name="data"
            className="field-input"
            type="date"
            defaultValue={atual?.data ?? dataPadrao}
            required
          />
        </label>
        <CampoCategoria
          opcoes={CATEGORIAS_VARIAVEIS}
          atual={atual?.categoria}
        />
      </div>
      <label className="field-check">
        <input
          type="checkbox"
          name="recorrente"
          defaultChecked={atual?.recorrente}
        />
        <span>
          Assinatura — repete em todas as faturas (academia, streaming…)
        </span>
      </label>
      {atual?.recorrente ? (
        <label className="field">
          <span className="field-label">
            Última fatura, se cancelada (deixe vazio se ativa)
          </span>
          <input
            name="fimMes"
            className="field-input"
            type="month"
            defaultValue={atual.fimMes ?? ""}
          />
        </label>
      ) : null}
    </>
  );
}
