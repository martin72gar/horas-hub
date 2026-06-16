"use client"

import { Button } from "@/components/ui/button";
import { markAsPaid } from "./actions";
import { useState } from "react";
import { CheckCircle } from "lucide-react";

export default function PayButton({ billId, punguanId, amount }: { billId: string, punguanId: string, amount: number }) {
  const [isPending, setIsPending] = useState(false);

  const handlePay = async () => {
    setIsPending(true);
    try {
      await markAsPaid(punguanId, billId, amount);
    } catch (e) {
      console.error(e);
      alert("Gagal memproses pembayaran");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button 
      onClick={handlePay} 
      disabled={isPending}
      size="sm" 
      variant="outline" 
      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
    >
      <CheckCircle className="h-4 w-4 mr-1.5" />
      {isPending ? "Memproses..." : "Bayar Lunas"}
    </Button>
  );
}
