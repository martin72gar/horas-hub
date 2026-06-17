import { verifyTenantAccess } from "@/lib/dal";
import { db } from "@/db";
import { households, members } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Phone, MapPin, Edit, Map, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'AKTIF':
      return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none';
    case 'NONAKTIF':
      return 'bg-stone-100 text-stone-800 hover:bg-stone-200 border-none';
    case 'PINDAH':
      return 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-none';
    case 'MENINGGAL':
      return 'bg-rose-100 text-rose-800 hover:bg-rose-200 border-none';
    default:
      return '';
  }
};

export default async function DetailKKPage({ params }: { params: Promise<{ punguanId: string, kkId: string }> }) {
  const resolvedParams = await params;
  const { punguanId, kkId } = resolvedParams;
  await verifyTenantAccess(punguanId);

  const [kk] = await db.select().from(households).where(and(eq(households.id, kkId), eq(households.punguanId, punguanId))).limit(1);

  if (!kk) {
    redirect(`/p/${punguanId}/kk`);
  }

  const rawMembers = await db.select().from(members).where(eq(members.householdId, kk.id));
  
  // Urutkan anggota keluarga secara logis: Kepala -> Istri -> Anak -> Lainnya
  const relOrder: Record<string, number> = { KEPALA: 1, ISTRI: 2, ANAK: 3, LAINNYA: 4 };
  const keluargaList = rawMembers.sort((a, b) => relOrder[a.relation] - relOrder[b.relation]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center space-x-4">
        <Link href={`/p/${punguanId}/kk`}>
          <Button variant="outline" size="icon" className="h-10 w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 flex justify-between items-center w-full">
          <div>
            <h2 className="text-2xl font-bold text-stone-800 tracking-tight font-serif">Detail Keluarga</h2>
            <p className="text-stone-500 mt-1">Informasi lengkap KK {kk.headName}</p>
          </div>
          <Link href={`/p/${punguanId}/kk/${kk.id}/edit`}>
            <Button className="bg-stone-800 hover:bg-stone-900 text-white">
              <Edit className="h-4 w-4 mr-2" /> Edit Data
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
             <h3 className="text-lg font-semibold text-stone-800 mb-4 border-b pb-2">Info Utama</h3>
             <div className="space-y-4">
               <div>
                 <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Kepala Keluarga</p>
                 <div className="flex items-center text-stone-800 font-medium">
                   <User className="h-4 w-4 mr-2 text-red-700" /> {kk.headName} {kk.panggoaran ? `(${kk.panggoaran})` : ''}
                 </div>
               </div>
               <div>
                 <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Pomparan</p>
                 <div className="flex items-center text-stone-800">
                   <Users className="h-4 w-4 mr-2 text-red-700" /> {kk.pomparan || '-'} {kk.nomorKeturunan ? `(No. ${kk.nomorKeturunan})` : ''}
                 </div>
               </div>
               <div>
                 <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Sektor</p>
                 <div className="flex items-center text-stone-800">
                   <Map className="h-4 w-4 mr-2 text-red-700" /> {kk.sektor || '-'}
                 </div>
               </div>
               <div>
                 <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">No. Handphone</p>
                 <div className="flex items-center text-stone-800">
                   <Phone className="h-4 w-4 mr-2 text-red-700" /> {kk.phone || '-'}
                 </div>
               </div>
               <div>
                 <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Alamat</p>
                 <div className="flex items-start text-stone-800">
                   <MapPin className="h-4 w-4 mr-2 text-red-700 mt-0.5" /> 
                   <span className="leading-tight">{kk.address || '-'}</span>
                 </div>
               </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Status</p>
                  <Badge variant="secondary" className={getStatusBadgeClass(kk.status)}>
                     {kk.status}
                  </Badge>
                </div>
             </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="p-5 border-b border-stone-200 bg-stone-50/50">
              <h3 className="text-lg font-semibold text-stone-800">Daftar Anggota Keluarga</h3>
            </div>
            <div className="p-0">
               <table className="w-full text-sm text-left">
                  <thead className="text-xs text-stone-600 bg-stone-100/50 border-b border-stone-200 uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-3">Nama Lengkap</th>
                      <th className="px-6 py-3">Pomparan</th>
                      <th className="px-6 py-3">Hubungan</th>
                      <th className="px-6 py-3 text-center">L/P</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {keluargaList.map(anggota => (
                      <tr key={anggota.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-stone-900">{anggota.fullName}</td>
                        <td className="px-6 py-4 text-stone-600 whitespace-nowrap">
                          {anggota.pomparan || '-'} {anggota.nomorKeturunan ? `(No. ${anggota.nomorKeturunan})` : ''}
                        </td>
                        <td className="px-6 py-4 text-stone-600">
                          <Badge variant="outline" className={anggota.relation === 'KEPALA' ? 'border-red-200 text-red-800 bg-red-50' : 'bg-stone-50'}>
                            {anggota.relation}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-stone-600 text-center font-medium">{anggota.gender}</td>
                        <td className="px-6 py-4 text-stone-600">
                          <Badge variant="secondary" className={getStatusBadgeClass(anggota.status)}>
                            {anggota.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
