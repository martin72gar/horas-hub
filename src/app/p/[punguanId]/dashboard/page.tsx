import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, Gift, Megaphone } from "lucide-react";
import { db } from "@/db";
import { households, iuranBills, arisanGroups } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export default async function DashboardPage({ params }: { params: Promise<{ punguanId: string }> }) {
  const resolvedParams = await params;
  const punguanId = resolvedParams.punguanId;

  // Simple stats calculation for MVP
  const [hhCountResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(households)
    .where(eq(households.punguanId, punguanId));

  const [arisanCountResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(arisanGroups)
    .where(eq(arisanGroups.punguanId, punguanId));

  const stats = [
    { name: "Total KK", value: hhCountResult.count || 0, icon: Users, color: "text-red-700", bg: "bg-red-100" },
    { name: "Kas Iuran Aktif", value: "Validasi Lunas", icon: CreditCard, color: "text-emerald-700", bg: "bg-emerald-100" },
    { name: "Grup Arisan", value: arisanCountResult.count || 0, icon: Gift, color: "text-amber-700", bg: "bg-amber-100" },
    { name: "Pengumuman", value: "2 Terbaru", icon: Megaphone, color: "text-blue-700", bg: "bg-blue-100" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-stone-800 tracking-tight">Ringkasan</h2>
        <p className="text-stone-500 mt-1">Pantau statistik utama Punguan Anda hari ini.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="border-stone-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-stone-600">{stat.name}</CardTitle>
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-stone-900 font-serif">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        <Card className="border-stone-200 shadow-sm rounded-xl overflow-hidden">
          <div className="h-1 bg-red-800 w-full"></div>
          <CardHeader>
            <CardTitle className="text-lg text-stone-800 flex items-center">
              <Megaphone className="w-5 h-5 mr-2 text-red-800" />
              Pengumuman Internal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               <div className="p-4 bg-red-50/50 hover:bg-red-50 text-stone-800 rounded-lg border border-red-100 transition-colors">
                 <p className="font-semibold text-sm mb-1 text-red-950">Rapat Pengurus Akhir Bulan</p>
                 <p className="text-sm text-stone-600">Mohon kehadiran seluruh pengurus pada akhir bulan ini untuk evaluasi arisan.</p>
               </div>
               <div className="p-4 bg-stone-50 hover:bg-stone-100 text-stone-800 rounded-lg border border-stone-200 transition-colors">
                 <p className="font-semibold text-sm mb-1">Perubahan Iuran Bulanan</p>
                 <p className="text-sm text-stone-600">Terhitung bulan depan, iuran bulanan akan menjadi Rp 50.000.</p>
               </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200 shadow-sm rounded-xl overflow-hidden">
          <div className="h-1 bg-stone-800 w-full"></div>
          <CardHeader>
            <CardTitle className="text-lg text-stone-800">Aktivitas Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div className="flex items-start">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 mr-3 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-stone-800">Iuran bulan ini telah di-generate.</p>
                  <p className="text-xs text-stone-500 mt-0.5">Bendahara • 2 jam yang lalu</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 mr-3 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-stone-800">Keluarga Aman Sirait ditambahkan ke sistem.</p>
                  <p className="text-xs text-stone-500 mt-0.5">Sekretaris • 5 jam yang lalu</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
