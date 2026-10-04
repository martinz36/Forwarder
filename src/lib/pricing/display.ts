import type { ChargeBasis } from "@/generated/prisma/enums";
import { BASIS } from "@/lib/labels";
import { formatMoney, formatQuantity, toNumber } from "@/lib/format";

type Num = number | string | { toString(): string } | null | undefined;

/**
 * Cómo se muestra la cantidad y el precio unitario de una línea.
 * En porcentajes la cantidad es valor/100: se muestra "valor CIF USD 18,500.00" y "0.35 %".
 */
export function describeLine(input: { basis: ChargeBasis; quantity: Num; unitPrice: Num; totalPrice: Num; currency: string; isOptional?: boolean }) {
  const isPercent = input.basis === "PERCENT_CIF" || input.basis === "PERCENT_FOB";
  const zeroOptional = input.isOptional && toNumber(input.totalPrice) === 0;
  return {
    quantity: isPercent
      ? `valor ${input.basis === "PERCENT_CIF" ? "CIF" : "FOB"} ${formatMoney(toNumber(input.quantity) * 100, input.currency)}`
      : `${formatQuantity(input.quantity)} ${BASIS[input.basis]}`.trim(),
    unitPrice: zeroOptional ? "—" : isPercent ? `${formatQuantity(input.unitPrice)} %` : formatMoney(input.unitPrice, input.currency),
    total: zeroOptional ? "Por confirmar" : formatMoney(input.totalPrice, input.currency),
  };
}
