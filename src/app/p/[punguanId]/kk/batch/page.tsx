import { verifyTenantAccess } from "@/lib/dal";
import BatchKKForm from "./BatchKKForm";

export default async function BatchKKPage({ params }: { params: Promise<{ punguanId: string }> }) {
  const resolvedParams = await params;
  const punguanId = resolvedParams.punguanId;
  await verifyTenantAccess(punguanId);

  return (
    <div className="space-y-6 pb-12 max-w-full">
      <div>
        <h2 className="text-2xl font-bold text-stone-800 tracking-tight font-serif">Tambah KK Batch</h2>
        <p className="text-stone-500 mt-1">Masukkan banyak data sekaligus seperti menggunakan Excel.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <BatchKKForm punguanId={punguanId} />
      </div>
    </div>
  );
}
