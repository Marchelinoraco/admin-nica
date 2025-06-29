"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/configFirebase";
import Link from "next/link";
import { useRouter } from "next/navigation"; // 🔹 Import useRouter

export function RegisterForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // 🔹 Inisialisasi router

  // 🔹 Handle Sign Up dengan Email & Password
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Sign up berhasil!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Sign up error:", error);
      alert("Sign up gagal. Coba lagi.");
    }
    setLoading(false);
  };

  // 🔹 Handle Sign Up dengan Google
  const handleGoogleSignUp = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      alert("Sign up dengan Google berhasil!");
    } catch (error) {
      console.error("Google sign-up error:", error);
      alert("Sign up dengan Google gagal.");
    }
  };

  return (
    <form
      onSubmit={handleSignUp}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Register Akun</h1>
        <p className="text-sm text-muted-foreground">
          Masukkan Email dan Kata Sandi anda untuk membuat akun
        </p>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Kata Sandi</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sedang Mendaftar..." : "Daftar"}
        </Button>

        {/* Divider */}
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">
            Atau daftar dengan
          </span>
        </div>

        {/* Sign Up dengan Google */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignUp}
          disabled={loading}
        >
          <svg
            className="w-5 h-5 mr-2"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M12 12h8.637c.08.527.137 1.06.137 1.637C20.774 18.63 16.85 22 12 22a10 10 0 0 1 0-20c2.537 0 4.86.903 6.696 2.41l-2.918 2.918A6 6 0 1 0 12 18c2.398 0 4.4-1.372 5.226-3.333H12v-2.667z"
            />
          </svg>
          Daftar dengan Google
        </Button>
      </div>

      <div className="text-center text-sm">
        Sudah Punya Akun?
        <Link href="/" className="underline underline-offset-4 ml-1">
          Masuk
        </Link>
      </div>
    </form>
  );
}
