"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../src/lib/supabase";
import logo from "./logo-black.png";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.push("/dashboard");
      }
    };

    checkSession();
  }, [router]);

  const handleSignUp = async () => {
    setLoading(true);
    setMessage("Creating account...");

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error?.message || "Signup failed");
      setLoading(false);
      return;
    }

    setMessage("Account created. You can now log in.");
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex justify-center mb-6">
          <Image
            src={logo}
            alt="AWTuning"
            width={220}
            height={90}
            priority
            className="h-auto w-56"
          />
        </div>

        <h1 className="text-3xl font-bold text-center text-black">
          File Portal
        </h1>

        <p className="text-center text-gray-600 mt-2 mb-8">
          Trade remap file upload system
        </p>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-red-600 text-white rounded-lg py-3 font-bold hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Please wait..." : "Log In"}
          </button>

          <button
            onClick={handleSignUp}
            disabled={loading}
            className="w-full bg-black text-white rounded-lg py-3 font-bold hover:bg-gray-800 disabled:opacity-50"
          >
            Create Account
          </button>

          {message && (
            <p className="text-sm text-center text-gray-700">{message}</p>
          )}
        </div>
      </div>
    </main>
  );
}