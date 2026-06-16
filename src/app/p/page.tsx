import { getUserPunguans } from "@/lib/dal";
import Link from "next/link";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";

export const runtime = "edge";

export default async function PunguanSelectionPage() {
  const punguans = await getUserPunguans();

  // Redirect automatically if they only have 1 punguan access
  if (punguans.length === 1) {
    redirect(`/p/${punguans[0].id}/dashboard`);
  }

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="max-w-4xl mx-auto pt-10">
        <div className="flex items-center space-x-3 mb-2">
          <Logo size={44} className="flex-shrink-0" />
          <h1 className="text-3xl font-bold text-stone-800 font-serif">HorasHub</h1>
        </div>
        <p className="text-stone-600 mb-10">Silakan pilih Punguan yang ingin Anda kelola.</p>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {punguans.map((punguan) => (
            <Link key={punguan.id} href={`/p/${punguan.id}/dashboard`}>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 hover:border-red-800 hover:shadow-md transition-all cursor-pointer group">
                <h2 className="text-xl font-semibold text-red-900 mb-2 group-hover:text-red-700">{punguan.name}</h2>
                <p className="text-stone-500 text-sm line-clamp-2">{punguan.description || "Tidak ada deskripsi."}</p>
              </div>
            </Link>
          ))}
          
          {punguans.length === 0 && (
            <div className="col-span-full text-center p-12 bg-white rounded-xl border border-stone-200 border-dashed">
              <p className="text-stone-500">Anda belum terdaftar sebagai pengurus di Punguan manapun.</p>
              <p className="text-sm mt-2 text-stone-400">Silakan hubungi Superadmin untuk mendapatkan akses.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
