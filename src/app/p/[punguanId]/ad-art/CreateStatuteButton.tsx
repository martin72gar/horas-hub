'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import type { StatuteType } from '@/lib/statute';
import { createStatute } from './actions';

export default function CreateStatuteButton({
  punguanId,
  type,
  punguanName,
}: {
  punguanId: string;
  type: StatuteType;
  punguanName: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsPending(true);
    setError(null);
    const result = await createStatute(punguanId, type, punguanName);
    setIsPending(false);
    if (result?.error) setError(result.error);
    else router.refresh();
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center gap-2 bg-red-800 hover:bg-red-900 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-md shadow-sm transition-colors"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Mulai Susun {type}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
