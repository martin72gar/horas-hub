import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format rupiah gaya Indonesia: 50000 -> "Rp50.000". */
export function formatRupiah(amount: number) {
  return `Rp${amount.toLocaleString("id-ID")}`;
}
