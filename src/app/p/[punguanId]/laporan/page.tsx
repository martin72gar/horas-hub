import { verifyTenantAccess } from "@/lib/dal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function LaporanPage({ params }: { params: Promise<{ punguanId: string }> }) {
  const resolvedParams = await params;
  const punguanId = resolvedParams.punguanId;
  await verifyTenantAccess(punguanId);

  const reports = [
    { title: "Daftar Kepala Keluarga & Anggota", desc: "Rekapitulasi seluruh KK yang berstatus aktif maupun pindah/meninggal beserta anggota keluarganya.", type: "Kependudukan" },
    { title: "Rekapitulasi Iuran Kas", desc: "Laporan status pembayaran iuran bulanan per KK untuk tahun berjalan.", type: "Keuangan" },
    { title: "Laporan Tunggakan Kas", desc: "Daftar KK yang memiliki tunggakan iuran lebih dari 1 bulan.", type: "Keuangan" },
    { title: "Riwayat Arisan", desc: "Daftar pemenang arisan dan status grup arisan.", type: "Sosial" },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div>
        <h2 className="text-2xl font-bold text-stone-800 tracking-tight font-serif">Laporan & Ekspor</h2>
        <p className="text-stone-500 mt-1">Unduh laporan operasional Punguan secara profesional.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report, idx) => (
          <Card key={idx} className="border-stone-200 shadow-sm hover:border-red-200 transition-colors group">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2">{report.type}</div>
                  <CardTitle className="text-lg text-stone-800">{report.title}</CardTitle>
                </div>
                <div className="p-2.5 rounded-full bg-red-50 group-hover:bg-red-100 transition-colors">
                  <FileText className="w-5 h-5 text-red-700" />
                </div>
              </div>
              <CardDescription className="pt-2 text-stone-600 text-sm leading-relaxed">{report.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full justify-center text-stone-700 border-stone-300 hover:bg-red-50 hover:text-red-800 hover:border-red-200">
                <Download className="w-4 h-4 mr-2" />
                Unduh PDF
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
