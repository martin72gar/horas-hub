"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn("credentials", formData, { redirectTo: '/p' })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Email atau password salah."
        default:
          return "Terjadi kesalahan. Silakan coba lagi."
      }
    }
    throw error
  }
}
