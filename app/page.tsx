import prisma from "@/lib/prisma";
import {
  DashboardControlTower,
  MonthlyFinancialData,
  ChannelDistributionData,
  UpcomingArrivalItem,
  PendingExpedientItem,
  PendingLiquidationItem,
} from "@/components/dashboard-control-tower";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Parallel database queries
  const [
    clients,
    activeOperationsCount,
    totalQuotationsLast30Days,
    acceptedQuotationsCount,
    operations,
    pendingExpedientsRaw,
    pendingLiquidationsRaw,
  ] = await Promise.all([
    prisma.client.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, businessName: true, documentNumber: true },
      orderBy: { businessName: "asc" },
    }),
    prisma.operation.count({
      where: { status: { not: "LIQUIDADO" } },
    }),
    prisma.quotation.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.quotation.count({
      where: { createdAt: { gte: thirtyDaysAgo }, status: "ACCEPTED" },
    }),
    prisma.operation.findMany({
      include: {
        charges: true,
        quotation: {
          include: { client: true },
        },
        liquidation: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.expedient.findMany({
      where: { quotations: { none: {} } },
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.liquidation.findMany({
      where: { status: "DRAFT" },
      include: {
        operation: {
          include: {
            quotation: { include: { client: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  // KPI Calculations
  let monthlyProfitUsd = 0;
  let monthlyProfitPen = 0;

  let pendingReceivableUsd = 0;
  let pendingReceivablePen = 0;

  let channelCounts = {
    VERDE: 0,
    NARANJA: 0,
    ROJO: 0,
    PENDIENTE: 0,
  };

  // Process operations for KPIs and chart data
  const monthlyMap: Record<string, { ventasUsd: number; costosUsd: number; profitUsd: number }> = {};

  operations.forEach((op) => {
    // Channel distribution
    if (op.customsChannel === "VERDE") channelCounts.VERDE++;
    else if (op.customsChannel === "NARANJA") channelCounts.NARANJA++;
    else if (op.customsChannel === "ROJO") channelCounts.ROJO++;
    else channelCounts.PENDIENTE++;

    // Calculate profit
    let opCostUsd = 0;
    let opSaleUsd = 0;

    op.charges.forEach((charge) => {
      if (charge.currency === "PEN") {
        monthlyProfitPen += charge.totalPrice - charge.totalCost;
      } else {
        opCostUsd += charge.totalCost;
        opSaleUsd += charge.totalPrice;
      }
    });

    const opProfitUsd = opSaleUsd - opCostUsd;
    monthlyProfitUsd += opProfitUsd;

    // Monthly chart grouping
    const dateObj = new Date(op.createdAt);
    const monthKey = dateObj.toLocaleString("es-PE", { month: "short", year: "2-digit" });

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { ventasUsd: 0, costosUsd: 0, profitUsd: 0 };
    }
    monthlyMap[monthKey].ventasUsd += opSaleUsd;
    monthlyMap[monthKey].costosUsd += opCostUsd;
    monthlyMap[monthKey].profitUsd += opProfitUsd;

    // Pending receivables from liquidations
    if (op.liquidation && op.liquidation.status !== "BILLED") {
      pendingReceivableUsd += op.liquidation.grandTotalUsd;
      pendingReceivablePen += op.liquidation.grandTotalPen;
    }
  });

  const conversionRatePercent =
    totalQuotationsLast30Days > 0
      ? Math.round((acceptedQuotationsCount / totalQuotationsLast30Days) * 100)
      : 0;

  // Format financial chart data
  const financialChartData: MonthlyFinancialData[] = Object.keys(monthlyMap).map((m) => ({
    month: m.toUpperCase(),
    ventasUsd: Number(monthlyMap[m].ventasUsd.toFixed(2)),
    costosUsd: Number(monthlyMap[m].costosUsd.toFixed(2)),
    profitUsd: Number(monthlyMap[m].profitUsd.toFixed(2)),
  }));

  // Format channel pie chart data
  const channelChartData: ChannelDistributionData[] = [
    { name: "Canal Verde (Levante)", value: channelCounts.VERDE, color: "#10b981" },
    { name: "Canal Naranja (Revisión)", value: channelCounts.NARANJA, color: "#f59e0b" },
    { name: "Canal Rojo (Aforo Físico)", value: channelCounts.ROJO, color: "#ef4444" },
    { name: "Por Determinar", value: channelCounts.PENDIENTE, color: "#94a3b8" },
  ];

  // Upcoming Arrivals
  const now = new Date();
  const upcomingArrivals: UpcomingArrivalItem[] = operations
    .filter((op) => op.status !== "LIQUIDADO" && op.eta)
    .map((op) => {
      const etaDate = new Date(op.eta!);
      const diffTime = etaDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        id: op.id,
        code: op.id.startsWith("OP-")
          ? op.id
          : `OP-${op.quotation.code.replace(/^COT-/, "")}`,
        clientName: op.quotation.client.businessName,
        eta: op.eta,
        customsChannel: op.customsChannel,
        status: op.status,
        daysRemaining,
      };
    })
    .sort((a, b) => new Date(a.eta!).getTime() - new Date(b.eta!).getTime())
    .slice(0, 5);

  // Format pending items
  const pendingExpedients: PendingExpedientItem[] = pendingExpedientsRaw.map((exp) => ({
    id: exp.id,
    code: exp.code,
    clientName: exp.client.businessName,
    loadType: exp.loadType,
    createdAt: exp.createdAt,
  }));

  const pendingLiquidations: PendingLiquidationItem[] = pendingLiquidationsRaw.map((liq) => ({
    id: liq.id,
    operationCode: liq.operation.quotation.code,
    clientName: liq.operation.quotation.client.businessName,
    grandTotalUsd: liq.grandTotalUsd,
    grandTotalPen: liq.grandTotalPen,
    createdAt: liq.createdAt,
  }));

  return (
    <DashboardControlTower
      kpis={{
        monthlyProfitUsd: Number(monthlyProfitUsd.toFixed(2)),
        monthlyProfitPen: Number(monthlyProfitPen.toFixed(2)),
        activeOperationsCount,
        pendingReceivableUsd: Number(pendingReceivableUsd.toFixed(2)),
        pendingReceivablePen: Number(pendingReceivablePen.toFixed(2)),
        conversionRatePercent,
        acceptedQuotationsCount,
        totalQuotationsLast30Days,
      }}
      financialChartData={financialChartData}
      channelChartData={channelChartData}
      upcomingArrivals={upcomingArrivals}
      pendingExpedients={pendingExpedients}
      pendingLiquidations={pendingLiquidations}
      clients={clients}
    />
  );
}
