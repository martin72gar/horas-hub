import { verifyTenantAccess } from "@/lib/dal";
import TambahKKForm from "./TambahKKForm";

export default async function TambahKKPage({ params }: { params: Promise<{ punguanId: string }> }) {
  const resolvedParams = await params;
  const punguanId = resolvedParams.punguanId;
  await verifyTenantAccess(punguanId);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-stone-800 tracking-tight font-serif">Tambah KK Baru</h2>
        <p className="text-stone-500 mt-1">Masukkan data Kepala Keluarga beserta anggota keluarga inti.</p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-stone-200">
        <TambahKKForm punguanId={punguanId} />
      </div>
    </div>
  );
}
