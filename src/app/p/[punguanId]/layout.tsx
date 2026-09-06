import { ReactNode } from "react";
import { getCurrentSession, verifyTenantAccessForSession } from "@/lib/dal";
import { db } from "@/db";
import { punguans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import AdminSidebar from "./AdminSidebar";

export default async function PunguanLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ punguanId: string }>;
}) {
  const resolvedParams = await params;
  const punguanId = resolvedParams.punguanId;
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  // Verify access and get role
  let role;
  try {
    role = await verifyTenantAccessForSession(punguanId, session);
  } catch {
    redirect("/p");
  }

  // Fetch Punguan name
  const punguanData = await db.select().from(punguans).where(eq(punguans.id, punguanId)).limit(1);
  if (!punguanData[0]) {
    redirect("/p");
  }
  const punguan = punguanData[0];

  return (
    <div className="min-h-dvh bg-stone-50 md:flex">
      <AdminSidebar
        punguanId={punguanId}
        punguanName={punguan.name}
        role={role}
        userName={session.user?.name}
        userEmail={session.user?.email}
      />

      <main className="min-w-0 flex-1 bg-[#F8F9FA]">
        <header className="hidden h-16 items-center border-b border-stone-200 bg-white px-8 shadow-sm md:flex">
          <h1 className="text-xl font-semibold text-stone-800">Panel Administrasi</h1>
        </header>
        <div className="min-w-0 p-4 sm:p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
