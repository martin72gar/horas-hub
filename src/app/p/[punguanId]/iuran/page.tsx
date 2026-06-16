import { verifyTenantAccess } from "@/lib/dal";
import { db } from "@/db";
import { iuranBills, households, iuranSettings } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, DollarSign } from "lucide-react";
import { generateBills } from "./actions";
import PayButton from "./PayButton";

export default async function IuranPage({ params }: { params: Promise<{ punguanId: string }> }) {
  const resolvedParams = await params;
  const punguanId = resolvedParams.punguanId;
  const role = await verifyTenantAccess(punguanId);
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Get Bills
  const bills = await db.select({
    id: iuranBills.id,
    month: iuranBills.month,
    year: iuranBills.year,
    amount: iuranBills.amount,
    status: iuranBills.status,
    householdId: households.id,
    headName: households.headName,
  })
  .from(iuranBills)
  .innerJoin(households, eq(iuranBills.householdId, households.id))
  .where(eq(iuranBills.punguanId, punguanId))
  .orderBy(desc(iuranBills.year), desc(iuranBills.month));

  // Get Settings
  const settingsList = await db.select().from(iuranSettings).where(eq(iuranSettings.punguanId, punguanId)).limit(1);
  const nominal = settingsList[0]?.monthlyAmount || 50000;

  const isBendaharaOrAdmin = role === 'BENDAHARA' || role === 'SUPERADMIN';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 tracking-tight font-serif">Iuran Bulanan</h2>
          <p className="text-stone-500 mt-1">Kelola tagihan dan pembayaran kas Punguan.</p>
        </div>
        
        {isBendaharaOrAdmin && (
          <form action={generateBills.bind(null, punguanId, currentMonth, currentYear, nominal)}>
             <Button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white w-full md:w-auto shadow-sm">
               <PlusCircle className="mr-2 h-4 w-4" /> Generate Tagihan Bulan Ini
             </Button>
          </form>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-5 border-b border-stone-200 bg-stone-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="flex items-center text-stone-600 bg-white px-3 py-1.5 rounded-md border border-stone-200 shadow-sm text-sm font-medium">
             <DollarSign className="w-4 h-4 mr-2 text-emerald-600" />
             Nominal Default: Rp {nominal.toLocaleString('id-ID')} / bulan
           </div>
           <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input 
              type="text" 
              placeholder="Cari KK..." 
              className="pl-9 pr-4 py-2 w-full border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-stone-600 bg-stone-100/80 border-b border-stone-200 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Nama KK</th>
                <th className="px-6 py-4 text-center">Periode</th>
                <th className="px-6 py-4">Nominal</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {bills.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-stone-500">
                    Belum ada tagihan ter-generate.
                  </td>
                </tr>
              ) : (
                bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-stone-900">{bill.headName}</td>
                    <td className="px-6 py-4 text-stone-600 text-center">{bill.month} / {bill.year}</td>
                    <td className="px-6 py-4 text-stone-600 font-medium">Rp {bill.amount.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4">
                      <Badge variant={bill.status === 'LUNAS' ? 'default' : bill.status === 'SEBAGIAN' ? 'secondary' : 'destructive'} 
                             className={
                               bill.status === 'LUNAS' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none' : 
                               bill.status === 'SEBAGIAN' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-none' : 
                               'bg-red-100 text-red-800 hover:bg-red-200 border-none'
                             }>
                        {bill.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {bill.status !== 'LUNAS' && isBendaharaOrAdmin ? (
                         <PayButton billId={bill.id} punguanId={punguanId} amount={bill.amount} />
                      ) : (
                         <span className="text-stone-400 text-xs italic">
                           {bill.status === 'LUNAS' ? 'Telah lunas' : 'Hanya lihat'}
                         </span>
                      )}
                    </td>
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
