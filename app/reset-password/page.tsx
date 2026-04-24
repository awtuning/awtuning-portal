"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../src/lib/supabase";
import logo from "../logo-black.png";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    setMessage("");

    if (!password || !confirmPassword) {
      setMessage("Please enter and confirm your new password");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Password updated successfully");

    setTimeout(() => {
      router.push("/");
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="bg-white text-black rounded-xl p-8 shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
          <img
            src={logo}
            alt="AWTuning"
            className="mx-auto mb-4 max-w-[190px]"
          />

          <h1 className="text-2xl font-bold">Reset Password</h1>

          <p className="text-sm text-gray-600 mt-2">
            Enter your new password below.
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg px-4 py-3"
          />

          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border rounded-lg px-4 py-3"
          />

          <button
            onClick={handleResetPassword}
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>

          {message && (
            <p className="text-center text-sm text-gray-700">{message}</p>
          )}
        </div>
      </div>
    </main>
  );
}