import { verifyTenantAccess } from "@/lib/dal";
import { db } from "@/db";
import { announcements, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Megaphone, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default async function PengumumanPage({ params }: { params: Promise<{ punguanId: string }> }) {
  const resolvedParams = await params;
  const punguanId = resolvedParams.punguanId;
  const role = await verifyTenantAccess(punguanId);
  const isPengurus = role === 'KETUA' || role === 'SEKRETARIS' || role === 'SUPERADMIN';

  const items = await db.select({
    id: announcements.id,
    title: announcements.title,
    content: announcements.content,
    createdAt: announcements.createdAt,
    authorName: users.name,
  })
  .from(announcements)
  .innerJoin(users, eq(announcements.createdBy, users.id))
  .where(eq(announcements.punguanId, punguanId))
  .orderBy(desc(announcements.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-stone-800 tracking-tight font-serif">Pengumuman Internal</h2>
          <p className="text-stone-500 mt-1">Informasi dan agenda kegiatan Punguan.</p>
        </div>
        {isPengurus && (
          <Button className="bg-red-800 hover:bg-red-900 text-white shadow-sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Buat Pengumuman
          </Button>
        )}
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
               <CardHeader className="pb-3">
                 <CardTitle className="text-xl text-stone-900">{item.title}</CardTitle>
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
