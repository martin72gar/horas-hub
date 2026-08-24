import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-6">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold font-serif text-red-900">404</p>
        <h1 className="mt-4 text-xl font-semibold text-stone-800">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-stone-500">
          Alamat yang Anda tuju tidak tersedia atau belum diterbitkan.
        </p>
        <Link href="/" className="inline-block mt-6 text-sm text-red-800 hover:underline">
          Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}
