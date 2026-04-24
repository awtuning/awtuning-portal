"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../src/lib/supabase";

type UserProfile = {
  id: string;
  email: string;
  role: string;
  company_name: string | null;
};

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, role, company_name")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(error.message);
        return;
      }

      setProfile(data);
    };

    loadProfile();
  }, []);

  useEffect(() => {
    const iframe = document.getElementById(
      "awtuningVehicleLookup"
    ) as HTMLIFrameElement | null;

    const handleMessage = (event: MessageEvent) => {
      if (!event || !event.data) return;
      if (event.data.type !== "awtuning-vl-height") return;
      if (event.origin !== "https://awtuningownlookup.adam-448.workers.dev") return;
      if (!iframe) return;

      iframe.style.height = `${event.data.height}px`;
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <main>
      <h1 className="text-3xl font-bold text-red-600 mb-8">Dashboard</h1>

      <div className="bg-white text-black rounded-xl p-6 shadow-lg mb-6">
        <h2 className="text-xl font-bold mb-2">Welcome</h2>

        <p className="mb-4">
          {profile?.company_name || profile?.email || "Loading..."}
        </p>

        {profile?.role === "admin" && (
          <button
            onClick={() => router.push("/admin/tickets")}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Open Admin Tickets
          </button>
        )}
      </div>

      <div className="bg-white text-black rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Vehicle Gains Lookup</h2>

        <iframe
          id="awtuningVehicleLookup"
          src="https://awtuningownlookup.adam-448.workers.dev"
          style={{
            width: "100%",
            border: 0,
            display: "block",
            paddingTop: "10px",
          }}
          scrolling="no"
          height="1"
          loading="lazy"
        />
      </div>
    </main>
  );
}