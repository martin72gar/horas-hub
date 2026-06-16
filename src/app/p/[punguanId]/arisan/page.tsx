import { verifyTenantAccess } from "@/lib/dal";
import { db } from "@/db";
import { arisanGroups, arisanCycles, households } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ArisanPage({ params }: { params: Promise<{ punguanId: string }> }) {
  const resolvedParams = await params;
  const punguanId = resolvedParams.punguanId;
  const role = await verifyTenantAccess(punguanId);
  const isBendaharaOrAdmin = role === 'BENDAHARA' || role === 'SUPERADMIN';

  const groups = await db.select().from(arisanGroups).where(eq(arisanGroups.punguanId, punguanId));

  const cycles = await db.select({
    id: arisanCycles.id,
    periodName: arisanCycles.periodName,
    cycleDate: arisanCycles.cycleDate,
    winnerName: households.headName,
    groupName: arisanGroups.name,
  })
  .from(arisanCycles)
  .innerJoin(arisanGroups, eq(arisanCycles.groupId, arisanGroups.id))
  .innerJoin(households, eq(arisanCycles.winnerHouseholdId, households.id))
  .where(eq(arisanGroups.punguanId, punguanId))
  .orderBy(desc(arisanCycles.cycleDate));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 tracking-tight font-serif">Arisan Punguan</h2>
          <p className="text-stone-500 mt-1">Kelola grup dan putaran arisan KK.</p>
        </div>
        {isBendaharaOrAdmin && (
          <Button className="bg-purple-700 hover:bg-purple-800 text-white shadow-sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Buat Grup Baru
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.length === 0 ? (
           <div className="col-span-full p-8 text-center bg-white border border-stone-200 rounded-xl">
             <p className="text-stone-500">Belum ada grup arisan yang dibuat.</p>
           </div>
        ) : (
          groups.map(g => (
            <Card key={g.id} className="border-stone-200 shadow-sm hover:border-purple-200 transition-colors">
              <CardHeader className="pb-3 border-b border-stone-100 flex flex-row justify-between items-center bg-stone-50/50">
                <CardTitle className="text-lg text-stone-800">{g.name}</CardTitle>
                <Badge variant={g.status === 'AKTIF' ? 'default' : 'secondary'} className={g.status === 'AKTIF' ? 'bg-purple-100 text-purple-800 hover:bg-purple-200 border-none' : ''}>
                  {g.status}
                </Badge>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-sm text-stone-500">Iuran per Putaran</p>
                    <p className="text-xl font-bold text-stone-900">Rp {g.amountPerPeriod.toLocaleString('id-ID')}</p>
                  </div>
                  {isBendaharaOrAdmin && (
                    <Button variant="outline" size="sm" className="text-purple-700 border-purple-200 hover:bg-purple-50">Kelola Grup</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-bold text-stone-800 tracking-tight mb-4">Riwayat Pemenang Terakhir</h3>
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
           <table className="w-full text-sm text-left">
            <thead className="text-xs text-stone-600 bg-stone-100/80 border-b border-stone-200 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Nama Pemenang (KK)</th>
                <th className="px-6 py-4">Grup Arisan</th>
                <th className="px-6 py-4">Putaran</th>
                <th className="px-6 py-4">Tanggal Undi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {cycles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-stone-500">
                    Belum ada riwayat pemenang arisan.
                  </td>
                </tr>
              ) : (
                cycles.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-stone-900 flex items-center">
                      <Gift className="w-4 h-4 mr-2 text-purple-500" />
                      {c.winnerName}
                    </td>
                    <td className="px-6 py-4 text-stone-600">{c.groupName}</td>
                    <td className="px-6 py-4 text-stone-600">{c.periodName}</td>
                    <td className="px-6 py-4 text-stone-600">{c.cycleDate ? new Date(c.cycleDate).toLocaleDateString('id-ID') : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
