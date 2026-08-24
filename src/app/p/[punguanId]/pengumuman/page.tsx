import { isPengurusRole, verifyTenantAccess } from "@/lib/dal";
import { db } from "@/db";
import { announcements, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Megaphone, Clock } from "lucide-react";
import { BuatPengumumanForm, PengumumanRowActions } from "./PengumumanActions";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default async function PengumumanPage({ params }: { params: Promise<{ punguanId: string }> }) {
  const resolvedParams = await params;
  const punguanId = resolvedParams.punguanId;
  const role = await verifyTenantAccess(punguanId);
  const isPengurus = isPengurusRole(role);

  const items = await db.select({
    id: announcements.id,
    title: announcements.title,
    content: announcements.content,
    isPublic: announcements.isPublic,
    createdAt: announcements.createdAt,
    authorName: users.name,
  })
  .from(announcements)
  .innerJoin(users, eq(announcements.createdBy, users.id))
  .where(eq(announcements.punguanId, punguanId))
  .orderBy(desc(announcements.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 tracking-tight font-serif">Pengumuman</h2>
          <p className="text-stone-500 mt-1">
            Informasi dan agenda kegiatan Punguan. Tandai &quot;Publik&quot; agar tampil di landing page.
          </p>
        </div>
        {isPengurus && <BuatPengumumanForm punguanId={punguanId} />}
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-4xl">
        {items.length === 0 ? (
          <div className="p-12 text-center bg-white border border-stone-200 rounded-xl shadow-sm">
             <Megaphone className="w-12 h-12 text-stone-300 mx-auto mb-4" />
             <p className="text-stone-500">Belum ada pengumuman untuk Punguan ini.</p>
          </div>
        ) : (
          items.map(item => (
            <Card key={item.id} className="border-stone-200 shadow-sm overflow-hidden">
               <div className="h-1.5 w-full bg-red-800"></div>
               <CardHeader className="pb-3 flex flex-wrap items-start justify-between gap-3">
                 <CardTitle className="text-xl text-stone-900">{item.title}</CardTitle>
                 {isPengurus && (
                   <PengumumanRowActions punguanId={punguanId} id={item.id} isPublic={item.isPublic} />
                 )}
               </CardHeader>
               <CardContent>
                 <p className="text-stone-700 whitespace-pre-wrap leading-relaxed">{item.content}</p>
               </CardContent>
               <CardFooter className="bg-stone-50 border-t border-stone-100 py-3 px-6 text-sm text-stone-500 flex items-center justify-between">
                 <div className="flex items-center">
                    <span className="font-medium mr-2 text-stone-600">{item.authorName}</span>
                 </div>
                 <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1.5 opacity-70" />
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: localeId })}
                 </div>
               </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
