"use client"

import { useActionState } from "react"
import { authenticate } from "./actions"
import Logo from "@/components/Logo"

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  )

  return (
    <div className="flex items-center justify-center min-h-screen bg-stone-50">
      <div className="p-8 bg-white rounded-xl shadow-lg w-full max-w-md border-t-4 border-red-800">
        <div className="flex justify-center mb-4">
          <Logo size={64} />
        </div>
        <h1 className="text-3xl font-bold text-center text-red-900 mb-2 font-serif">HorasHub</h1>
        <p className="text-center text-stone-500 mb-8">Portal Administrasi Punguan</p>
        <form
          action={formAction}
          className="space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-stone-700">Email</label>
            <input 
              name="email" 
              type="email" 
              required 
              placeholder="nama@email.com"
              className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Password</label>
            <input 
              name="password" 
              type="password" 
              required 
              placeholder="••••••••"
              className="mt-1 block w-full px-3 py-2 border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          {errorMessage && (
            <div className="text-red-500 text-sm mt-2">{errorMessage}</div>
          )}
          <button 
            type="submit" 
            disabled={isPending}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-800 hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
          >
            {isPending ? "Masuk..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
