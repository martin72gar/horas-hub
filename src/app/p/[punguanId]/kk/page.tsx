import { verifyTenantAccess } from "@/lib/dal";
import { db } from "@/db";
import { households, members } from "@/db/schema";
import { eq, and, or, ilike, type SQL } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import SearchInput from "./SearchInput";

export default async function KKPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ punguanId: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const punguanId = resolvedParams.punguanId;
  const searchQuery = resolvedSearchParams.q || "";
  const role = await verifyTenantAccess(punguanId);
  
  // Scoped conditions
  const conditions: (SQL | undefined)[] = [eq(households.punguanId, punguanId)];
  if (searchQuery) {
    const pattern = `%${searchQuery}%`;
    const searchFilter = or(
      ilike(households.headName, pattern),
      ilike(households.panggoaran, pattern),
      ilike(households.sektor, pattern),
      ilike(households.pomparan, pattern),
      ilike(members.fullName, pattern)
    );
    if (searchFilter) {
      conditions.push(searchFilter);
    }
  }

  // Ambil data menggunakan DAL yang aman antar-tenant
  const kkListRaw = await db.select({
    id: households.id,
    headName: households.headName,
    panggoaran: households.panggoaran,
    sektor: households.sektor,
    pomparan: households.pomparan,
    nomorKeturunan: households.nomorKeturunan,
    phone: households.phone,
    address: households.address,
    status: households.status,
    wifeName: members.fullName,
  })
  .from(households)
  .leftJoin(members, and(eq(members.householdId, households.id), eq(members.relation, 'ISTRI')))
  .where(and(...conditions));

  const kkList = kkListRaw.map(kk => {
    let formattedHeadName = kk.headName;
    if (kk.headName) {
      const parts = kk.headName.trim().split(/\s+/);
      if (parts.length > 1) {
        const marga = parts.pop();
        const initials = parts.map(p => p.charAt(0).toUpperCase() + ".").join(" ");
        formattedHeadName = `${initials} ${marga}`;
      }
    }

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
        const words = kk.wifeName.trim().split(/\s+/);
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
      formattedName: `${formattedHeadName}${wifePart}${panggPart}`
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
          <div className="flex gap-3">
            <Link href={`/p/${punguanId}/kk/batch`}>
              <Button variant="outline" className="bg-white border-stone-300 text-stone-700 hover:bg-stone-50 shadow-sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Tambah Batch
              </Button>
            </Link>
            <Link href={`/p/${punguanId}/kk/tambah`}>
              <Button className="bg-red-800 hover:bg-red-900 text-white shadow-sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Tambah KK
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <SearchInput />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-stone-600 bg-stone-100/80 border-b border-stone-200 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Nama Kepala Keluarga</th>
                <th className="px-6 py-4">Sektor</th>
                <th className="px-6 py-4">Pomparan</th>
                <th className="px-6 py-4">No. HP</th>
                <th className="px-6 py-4">Alamat</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {kkList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-stone-500">
                    Belum ada data KK.
                  </td>
                </tr>
              ) : (
                kkList.map((kk) => (
                  <tr key={kk.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-stone-900">{kk.formattedName}</td>
                    <td className="px-6 py-4 text-stone-600">{kk.sektor || '-'}</td>
                    <td className="px-6 py-4 text-stone-600">{kk.pomparan || '-'} {kk.nomorKeturunan ? `(No.${kk.nomorKeturunan})` : ''}</td>
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
