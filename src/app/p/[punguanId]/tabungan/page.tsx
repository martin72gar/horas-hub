import Link from "next/link";
import { verifyTenantAccess } from "@/lib/dal";
import { db } from "@/db";
import { tabunganFunds, tabunganTransactions } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PiggyBank, ArrowRight } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { hitungRingkasan, type TabunganTxType } from "@/lib/tabungan";
import FundFormDialog from "./FundFormDialog";

export default async function TabunganPage({ params }: { params: Promise<{ punguanId: string }> }) {
  const resolvedParams = await params;
  const punguanId = resolvedParams.punguanId;
  const role = await verifyTenantAccess(punguanId);
  const isBendaharaOrAdmin = role === 'BENDAHARA' || role === 'SUPERADMIN';

  const funds = await db.select().from(tabunganFunds)
    .where(eq(tabunganFunds.punguanId, punguanId))
    .orderBy(desc(tabunganFunds.createdAt));

  // Satu query untuk seluruh dana; ringkasan per dana dihitung di memori.
  const totals = await db.select({
    fundId: tabunganTransactions.fundId,
    type: tabunganTransactions.type,
    total: sql<number>`sum(${tabunganTransactions.amount})::int`,
  })
  .from(tabunganTransactions)
  .where(eq(tabunganTransactions.punguanId, punguanId))
  .groupBy(tabunganTransactions.fundId, tabunganTransactions.type);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 tracking-tight font-serif">Tabungan / Dana Bertujuan</h2>
          <p className="text-stone-500 mt-1">Kelola dana yang dikumpulkan untuk acara tertentu.</p>
        </div>
        {isBendaharaOrAdmin && <FundFormDialog punguanId={punguanId} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {funds.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white border border-stone-200 rounded-xl">
            <p className="text-stone-500">Belum ada dana yang dibuat.</p>
          </div>
        ) : (
          funds.map((f) => {
            const ringkasan = hitungRingkasan(
              totals.filter((t) => t.fundId === f.id).map((t) => ({ type: t.type as TabunganTxType, total: t.total }))
            );
            const persen = f.targetAmount
              ? Math.min(100, Math.round((ringkasan.danaTerkumpul / f.targetAmount) * 100))
              : null;

            return (
              <Card key={f.id} className="border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
                <CardHeader className="pb-3 border-b border-stone-100 flex flex-row justify-between items-center bg-stone-50/50">
                  <CardTitle className="text-lg text-stone-800 flex items-center">
                    <PiggyBank className="w-4 h-4 mr-2 text-emerald-600" />
                    {f.name}
                  </CardTitle>
                  <Badge variant={f.status === 'AKTIF' ? 'default' : 'secondary'} className={f.status === 'AKTIF' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none' : ''}>
                    {f.status}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <p className="text-sm text-stone-500">
                    {[f.targetEvent, f.targetYear].filter(Boolean).join(" ") || "Tanpa acara sasaran"}
                  </p>

                  <div className="space-y-1">
                    <p className="text-sm text-stone-500">Dana Terkumpul</p>
                    <p className="text-2xl font-bold text-stone-900">{formatRupiah(ringkasan.danaTerkumpul)}</p>
                    {persen !== null && (
                      <>
                        <div className="h-2 bg-stone-100 rounded-full overflow-hidden mt-2">
                          <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${persen}%` }} />
                        </div>
                        <p className="text-xs text-stone-500">{persen}% dari target {formatRupiah(f.targetAmount!)}</p>
                      </>
                    )}
                  </div>

                  <div className="flex justify-between items-center gap-2 pt-1">
                    {isBendaharaOrAdmin ? <FundFormDialog punguanId={punguanId} fund={f} /> : <span />}
                    <Link href={`/p/${punguanId}/tabungan/${f.id}`}>
                      <Button variant="outline" size="sm" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                        Lihat Rekap <ArrowRight className="h-4 w-4 ml-1.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
