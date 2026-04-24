"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../src/lib/supabase";

type TicketItem = {
  id: string;
  registration_or_vin: string;
  vehicle_make: string;
  vehicle_model: string;
  status: string;
  email: string;
  company_name: string | null;
};

export default function AdminTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);

  const formatStatus = (status: string) => {
    if (status === "in_progress") return "In Progress";
    if (status === "completed") return "Completed";
    if (status === "paid") return "Paid";
    return "Pending";
  };

  const getStatusStyle = (status: string) => {
    if (status === "completed") return "bg-green-600 text-white";
    if (status === "in_progress") return "bg-orange-500 text-white";
    if (status === "paid") return "bg-gray-500 text-white";
    return "bg-red-600 text-white";
  };

  useEffect(() => {
    const loadTickets = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("requests")
        .select(
          "id, registration_or_vin, vehicle_make, vehicle_model, status, email, company_name"
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error.message);
        setLoading(false);
        return;
      }

      setTickets(data || []);
      setLoading(false);
    };

    loadTickets();
  }, []);

  return (
    <main>
      <h1 className="text-3xl font-bold text-red-600 mb-8">Admin Tickets</h1>

      {loading ? (
        <p className="text-white">Loading...</p>
      ) : tickets.length === 0 ? (
        <p className="text-gray-300">No tickets found.</p>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => router.push(`/tickets/${ticket.id}`)}
              className="w-full text-left bg-white text-black rounded-xl p-6 shadow-lg hover:shadow-2xl transition"
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-bold">
                    {ticket.company_name || ticket.email}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Reg / VIN</p>
                  <p className="font-bold">
                    {ticket.registration_or_vin || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Make</p>
                  <p className="font-bold">{ticket.vehicle_make || "-"}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Model</p>
                  <p className="font-bold">{ticket.vehicle_model || "-"}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span
                    className={`inline-block text-sm px-3 py-1 rounded-full ${getStatusStyle(
                      ticket.status
                    )}`}
                  >
                    {formatStatus(ticket.status)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}