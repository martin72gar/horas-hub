import { ReactNode } from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { verifyTenantAccess } from "@/lib/dal";
import { db } from "@/db";
import { punguans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { LayoutDashboard, Users, CreditCard, Gift, Megaphone, FileText, Settings, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default async function PunguanLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ punguanId: string }>;
}) {
  const resolvedParams = await params;
  const punguanId = resolvedParams.punguanId;
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Verify access and get role
  let role;
  try {
    role = await verifyTenantAccess(punguanId);
  } catch (error) {
    redirect("/p");
  }

  // Fetch Punguan name
  const punguanData = await db.select().from(punguans).where(eq(punguans.id, punguanId)).limit(1);
  if (!punguanData[0]) {
    redirect("/p");
  }
  const punguan = punguanData[0];

  const navItems = [
    { name: "Dashboard", href: `/p/${punguanId}/dashboard`, icon: LayoutDashboard },
    { name: "Daftar KK", href: `/p/${punguanId}/kk`, icon: Users },
    { name: "Iuran", href: `/p/${punguanId}/iuran`, icon: CreditCard },
    { name: "Arisan", href: `/p/${punguanId}/arisan`, icon: Gift },
    { name: "Pengumuman", href: `/p/${punguanId}/pengumuman`, icon: Megaphone },
    { name: "Laporan", href: `/p/${punguanId}/laporan`, icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-stone-900 text-stone-100 flex flex-col shadow-xl z-10 border-r border-stone-800">
        <div className="p-6 border-b border-stone-800 bg-stone-950 relative overflow-hidden">
          {/* Subtle Batak Gorga Motif (Abstract visualization) */}
          <div className="absolute right-0 top-0 opacity-10">
            <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
               <path d="M0,0 L100,100 M100,0 L0,100 M50,0 L50,100 M0,50 L100,50" stroke="#FF0000" strokeWidth="4"/>
               <circle cx="50" cy="50" r="20" stroke="#FFFFFF" strokeWidth="2" fill="none"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold font-serif text-white relative z-10">HorasHub</h2>
          <p className="text-stone-400 text-sm mt-1 truncate relative z-10">{punguan.name}</p>
          <div className="mt-3 inline-block px-2.5 py-1 bg-red-900/80 text-xs font-semibold tracking-wider rounded text-red-100 border border-red-800 relative z-10">
            ROLE: {role}
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-1.5 px-4">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-stone-300 hover:bg-red-950 hover:text-white transition-all group border border-transparent hover:border-red-900/50"
                >
                  <item.icon className="h-5 w-5 mr-3 text-red-700 group-hover:text-red-500 transition-colors" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-stone-800 flex items-center space-x-3 bg-stone-950">
          <Avatar className="h-10 w-10 bg-red-900 text-red-100 border border-red-800">
            <AvatarFallback>{session.user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{session.user?.name}</p>
            <p className="text-xs text-stone-500 truncate">{session.user?.email}</p>
          </div>
          <Link href="/api/auth/signout" className="p-2 text-stone-500 hover:text-red-400 hover:bg-stone-900 rounded-md transition-colors">
            <LogOut className="h-5 w-5" />
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8F9FA]">
        <header className="bg-white border-b border-stone-200 h-16 flex items-center px-8 shadow-sm">
          <h1 className="text-xl font-semibold text-stone-800">Panel Administrasi</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
