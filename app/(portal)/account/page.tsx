"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../src/lib/supabase";

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("email, company_name, contact_number, address")
        .eq("id", user.id)
        .single();

      if (data) {
        setEmail(data.email || user.email || "");
        setCompanyName(data.company_name || "");
        setContactNumber(data.contact_number || "");
        setAddress(data.address || "");
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    setMessage("Saving...");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Not logged in");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        company_name: companyName,
        contact_number: contactNumber,
        address,
      })
      .eq("id", user.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Account updated");
  };

  return (
    <main>
      <h1 className="text-3xl font-bold text-red-600 mb-8">Account</h1>

      <div className="bg-white text-black rounded-xl p-8 shadow-lg max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              value={email}
              disabled
              className="w-full border rounded-lg px-4 py-3 bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Company Name
            </label>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Contact Number
            </label>
            <input
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border rounded-lg px-4 py-3 min-h-28"
            />
          </div>

          <button
            onClick={handleSave}
            className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700"
          >
            Save Account
          </button>

          {message && <p className="text-sm text-gray-600">{message}</p>}
        </div>
      </div>
    </main>
  );
}