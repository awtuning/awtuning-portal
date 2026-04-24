"use client";

import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { ReactNode } from "react";
import { supabase } from "../../src/lib/supabase";
import logo from "../logo.png";
import { useEffect, useState } from "react";

export default function PortalLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const navItemClass = (href: string) =>
    `w-full text-left px-4 py-3 rounded-lg font-medium transition ${
      pathname === href
        ? "bg-red-600 text-white"
        : "text-white hover:bg-red-600"
    }`;

  const [role, setRole] = useState<string | null>(null);

	useEffect(() => {
	  const loadRole = async () => {
		const {
		  data: { user },
		} = await supabase.auth.getUser();

		if (!user) return;

		const { data } = await supabase
		  .from("profiles")
		  .select("role")
		  .eq("id", user.id)
		  .single();

		setRole(data?.role || null);
	  };

	  loadRole();
	}, []);
  
  return (
    <main className="min-h-screen bg-black text-white flex">
      <aside className="w-72 bg-black border-r border-gray-800 p-6 flex flex-col">
        <button
          onClick={() => router.push("/dashboard")}
          className="mb-10 flex justify-center"
        >
          <Image
            src={logo}
            alt="AWTuning"
            width={190}
            height={80}
            priority
            className="h-auto w-[190px]"
          />
        </button>

        <nav className="space-y-3">
          <button
            className={navItemClass("/dashboard")}
            onClick={() => router.push("/dashboard")}
          >
            Dashboard
          </button>

          <button
            className={navItemClass("/new-request")}
            onClick={() => router.push("/new-request")}
          >
            New Ticket
          </button>

          <button
            className={navItemClass("/my-requests")}
            onClick={() => router.push("/my-requests")}
          >
            Tickets
          </button>

          {role === "admin" && (
			  <button
				className={navItemClass("/admin/tickets")}
				onClick={() => router.push("/admin/tickets")}
			  >
				Admin Tickets
			  </button>
			)}
		  <button
			  className={navItemClass("/account")}
			  onClick={() => router.push("/account")}
			>
			  Account
			</button>
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto w-full bg-white text-black px-4 py-3 rounded-lg font-bold hover:bg-red-600 hover:text-white transition"
        >
          Log Out
        </button>
      </aside>

      <section className="flex-1 p-10 overflow-y-auto">{children}</section>
    </main>
  );
}