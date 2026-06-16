import { verifyTenantAccess } from "@/lib/dal";
import { db } from "@/db";
import { households, members } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, Edit } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function KKPage({ params }: { params: Promise<{ punguanId: string }> }) {
  const resolvedParams = await params;
  const punguanId = resolvedParams.punguanId;
  const role = await verifyTenantAccess(punguanId);
  
  // Ambil data menggunakan DAL yang aman antar-tenant
  const kkListRaw = await db.select({
    id: households.id,
    headName: households.headName,
    panggoaran: households.panggoaran,
    phone: households.phone,
    address: households.address,
    status: households.status,
    wifeName: members.fullName,
  })
  .from(households)
  .leftJoin(members, and(eq(members.householdId, households.id), eq(members.relation, 'ISTRI')))
  .where(eq(households.punguanId, punguanId));

  const kkList = kkListRaw.map(kk => {
    let wifePart = "";
    if (kk.wifeName) {
      const wifeLower = kk.wifeName.toLowerCase();
      const brIndex = wifeLower.indexOf("br.");
      const brSpaceIndex = wifeLower.indexOf("br ");
      
      let extractIdx = -1;
      if (brIndex !== -1) extractIdx = brIndex;
      else if (brSpaceIndex !== -1) extractIdx = brSpaceIndex;

      if (extractIdx !== -1) {
        wifePart = "/" + kk.wifeName.substring(extractIdx).trim();
      } else {
        const words = kk.wifeName.trim().split(" ");
        const lastWord = words[words.length - 1];
        wifePart = `/br. ${lastWord}`;
      }
    }

    let panggPart = "";
    if (kk.panggoaran) {
      panggPart = ` (${kk.panggoaran})`;
    }

    return {
      ...kk,
      formattedName: `${kk.headName}${wifePart}${panggPart}`
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 tracking-tight font-serif">Daftar Kepala Keluarga (KK)</h2>
          <p className="text-stone-500 mt-1">Kelola data keluarga anggota Punguan Anda.</p>
        </div>
        {(role === 'SEKRETARIS' || role === 'SUPERADMIN') && (
          <Link href={`/p/${punguanId}/kk/tambah`}>
            <Button className="bg-red-800 hover:bg-red-900 text-white shadow-sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Tambah KK Baru
            </Button>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input 
              type="text" 
              placeholder="Cari nama KK..." 
              className="pl-9 pr-4 py-2 w-full border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-red-800"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-stone-600 bg-stone-100/80 border-b border-stone-200 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Nama Kepala Keluarga</th>
                <th className="px-6 py-4">No. HP</th>
                <th className="px-6 py-4">Alamat</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {kkList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-stone-500">
                    Belum ada data KK.
                  </td>
                </tr>
              ) : (
                kkList.map((kk) => (
                  <tr key={kk.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-stone-900">{kk.formattedName}</td>
                    <td className="px-6 py-4 text-stone-600">{kk.phone || '-'}</td>
                    <td className="px-6 py-4 text-stone-600 truncate max-w-xs">{kk.address || '-'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={kk.status === 'AKTIF' ? 'default' : 'secondary'} className={kk.status === 'AKTIF' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : ''}>
                        {kk.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/p/${punguanId}/kk/${kk.id}`}>
                        <Button variant="ghost" size="sm" className="text-red-800 hover:text-red-900 hover:bg-red-50">
                          <Edit className="h-4 w-4 mr-2" /> Detail
                        </Button>
                      </Link>
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
