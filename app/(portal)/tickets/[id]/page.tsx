"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../src/lib/supabase";

type RequestFile = {
  id: string;
  file_path: string;
  file_type?: string;
};

type Ticket = {
  id: string;
  user_id: string;
  registration_or_vin: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_engine: string;
  vehicle_ecu: string;
  vehicle_transmission: string;
  already_tuned: string;
  tuning_option: string;
  egr_delete: boolean;
  dpf_off: boolean;
  speed_limiter_disable: boolean;
  ecu_clone: boolean;
  pat_fluid_off: boolean;
  dtc_disable: boolean;
  adblue_off: boolean;
  nox_off: boolean;
  swirl_flaps_off: boolean;
  cat_off: boolean;
  immo_off: boolean;
  diesel_hard_cut: boolean;
  petrol_crackles: boolean;
  notes: string;
  status: string;
  email: string;
  request_files?: RequestFile[];
};

type Profile = {
  id: string;
  role: string;
};

type CustomerProfile = {
  company_name: string | null;
  contact_number: string | null;
  address: string | null;
};

export default function TicketPage() {
  const { id } = useParams();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile | null>(null);
  const [status, setStatus] = useState("");
  const [tunedFile, setTunedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const isAdmin = profile?.role === "admin";

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      let loggedInProfile: Profile | null = null;

      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", user.id)
          .single();

        loggedInProfile = profileData || null;
        setProfile(loggedInProfile);
      }

      const { data: ticketData, error: ticketError } = await supabase
        .from("requests")
        .select(`
          *,
          request_files (
            id,
            file_path,
            file_type
          )
        `)
        .eq("id", id)
        .single();

      if (ticketError || !ticketData) {
        console.error(ticketError?.message);
        setLoading(false);
        return;
      }

      setTicket(ticketData);
      setStatus(ticketData.status || "");

      if (loggedInProfile?.role === "admin" && ticketData.user_id) {
        const { data: customerData } = await supabase
          .from("profiles")
          .select("company_name, contact_number, address")
          .eq("id", ticketData.user_id)
          .single();

        setCustomerProfile(customerData || null);
      }

      setLoading(false);
    };

    loadData();
  }, [id]);

  const refreshTicket = async () => {
    if (!ticket) return;

    const { data: refreshedTicket } = await supabase
      .from("requests")
      .select(`
        *,
        request_files (
          id,
          file_path,
          file_type
        )
      `)
      .eq("id", ticket.id)
      .single();

    if (refreshedTicket) {
      setTicket(refreshedTicket);
    }
  };

  const getFileName = (path: string) => {
    return path.split("/").pop() || path;
  };

  const handleDownload = async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from("ticket-files")
      .download(filePath);

    if (error) {
      setMessage(error.message);
      return;
    }

    const url = window.URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = getFileName(filePath);
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDeleteFile = async (fileId: string, filePath: string) => {
    if (!confirm("Delete this file?")) return;

    const { error: storageError } = await supabase.storage
      .from("ticket-files")
      .remove([filePath]);

    if (storageError) {
      setMessage(storageError.message);
      return;
    }

    const { error: dbError } = await supabase
      .from("request_files")
      .delete()
      .eq("id", fileId);

    if (dbError) {
      setMessage(dbError.message);
      return;
    }

    setTicket((current) => {
      if (!current) return current;

      return {
        ...current,
        request_files: current.request_files?.filter((file) => file.id !== fileId),
      };
    });

    setMessage("File deleted");
  };

  const handleDeleteTicket = async () => {
    if (!ticket) return;
    if (!confirm("Delete this ticket and all linked files?")) return;

    const filePaths = ticket.request_files?.map((file) => file.file_path) || [];

    if (filePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("ticket-files")
        .remove(filePaths);

      if (storageError) {
        setMessage(storageError.message);
        return;
      }
    }

    const { error } = await supabase
      .from("requests")
      .delete()
      .eq("id", ticket.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    window.location.href = "/admin/tickets";
  };

  const handleStatusUpdate = async () => {
    const { error } = await supabase
      .from("requests")
      .update({ status })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setTicket((current) => current ? { ...current, status } : current);
    setMessage("Status updated successfully");
  };

  const handleTunedFileUpload = async () => {
    if (!tunedFile || !ticket) {
      setMessage("Please choose a tuned file first");
      return;
    }

    const fileName = `${ticket.user_id}/${ticket.id}/tuned-${tunedFile.name}`;

    const { error: uploadError } = await supabase.storage
      .from("ticket-files")
      .upload(fileName, tunedFile, { upsert: true });

    if (uploadError) {
      setMessage(uploadError.message);
      return;
    }

    const { error: insertError } = await supabase
      .from("request_files")
      .insert([
        {
          request_id: ticket.id,
          user_id: ticket.user_id,
          file_path: fileName,
          file_type: "tuned",
        },
      ]);

    if (insertError) {
      setMessage(insertError.message);
      return;
    }

    const emailResponse = await fetch("/api/ticket-updated-email", {
	  method: "POST",
	  headers: {
		"Content-Type": "application/json",
	  },
	  body: JSON.stringify({
		email: ticket.email,
		registration: ticket.registration_or_vin,
		ticket_id: ticket.id,
	  }),
	});

	setTunedFile(null);
	if (!emailResponse.ok) {
	  console.error("Customer update email failed");
	  setMessage("File uploaded, but email failed to send");
	} else {
	  setMessage("Tuned file uploaded and customer notified");
	}
	
    
    await refreshTicket();
  };

  if (loading) return <p className="text-white p-10">Loading...</p>;
  if (!ticket) return <p className="text-white p-10">Ticket not found</p>;

  const originalFiles =
    ticket.request_files?.filter((file) => file.file_type !== "tuned") || [];

  const tunedFiles =
    ticket.request_files?.filter((file) => file.file_type === "tuned") || [];

  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold text-red-600">
        Ticket: {ticket.registration_or_vin}
      </h1>

      {isAdmin && (
        <div className="bg-white text-black rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Customer Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <p><strong>Company:</strong> {customerProfile?.company_name || "-"}</p>
            <p><strong>Email:</strong> {ticket.email || "-"}</p>
            <p><strong>Phone:</strong> {customerProfile?.contact_number || "-"}</p>
            <p><strong>Address:</strong> {customerProfile?.address || "-"}</p>
          </div>
        </div>
      )}

      <div className="bg-white text-black rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Vehicle Details</h2>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <p><strong>Make:</strong> {ticket.vehicle_make || "-"}</p>
          <p><strong>Model:</strong> {ticket.vehicle_model || "-"}</p>
          <p><strong>Engine:</strong> {ticket.vehicle_engine || "-"}</p>
          <p><strong>ECU:</strong> {ticket.vehicle_ecu || "-"}</p>
          <p><strong>Transmission:</strong> {ticket.vehicle_transmission || "-"}</p>
          <p><strong>Already Tuned:</strong> {ticket.already_tuned || "-"}</p>
        </div>
      </div>

      <div className="bg-white text-black rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Tuning</h2>
        <p><strong>Option:</strong> {ticket.tuning_option || "-"}</p>
      </div>

      <div className="bg-white text-black rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Add Ons</h2>

        <div className="grid grid-cols-2 gap-2 text-sm">
          {ticket.egr_delete && <p>EGR Delete</p>}
          {ticket.dpf_off && <p>DPF Off</p>}
          {ticket.speed_limiter_disable && <p>Speed Limiter Disable</p>}
          {ticket.ecu_clone && <p>ECU Clone</p>}
          {ticket.pat_fluid_off && <p>PAT Fluid Off</p>}
          {ticket.dtc_disable && <p>DTC Disable</p>}
          {ticket.adblue_off && <p>Adblue Off</p>}
          {ticket.nox_off && <p>NOX Off</p>}
          {ticket.swirl_flaps_off && <p>Swirl Flaps Off</p>}
          {ticket.cat_off && <p>Cat Off</p>}
          {ticket.immo_off && <p>Immo Off</p>}
          {ticket.diesel_hard_cut && <p>Diesel Hard Cut</p>}
          {ticket.petrol_crackles && <p>Petrol Crackles</p>}

          {!ticket.egr_delete &&
            !ticket.dpf_off &&
            !ticket.speed_limiter_disable &&
            !ticket.ecu_clone &&
            !ticket.pat_fluid_off &&
            !ticket.dtc_disable &&
            !ticket.adblue_off &&
            !ticket.nox_off &&
            !ticket.swirl_flaps_off &&
            !ticket.cat_off &&
            !ticket.immo_off &&
            !ticket.diesel_hard_cut &&
            !ticket.petrol_crackles && <p>No add ons selected.</p>}
        </div>
      </div>

      <div className="bg-white text-black rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Original Files</h2>

        {originalFiles.length > 0 ? (
          <ul className="space-y-2">
            {originalFiles.map((file) => (
              <li key={file.id} className="flex items-center justify-between gap-4">
                <button
                  onClick={() => handleDownload(file.file_path)}
                  className="text-red-600 hover:underline"
                >
                  {getFileName(file.file_path)}
                </button>

                {isAdmin && (
                  <button
                    onClick={() => handleDeleteFile(file.id, file.file_path)}
                    className="text-sm bg-black text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No original files uploaded.</p>
        )}
      </div>

      <div className="bg-white text-black rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Tuned Files</h2>

        {tunedFiles.length > 0 ? (
          <ul className="space-y-2">
            {tunedFiles.map((file) => (
              <li key={file.id} className="flex items-center justify-between gap-4">
                <button
                  onClick={() => handleDownload(file.file_path)}
                  className="text-red-600 hover:underline"
                >
                  {getFileName(file.file_path)}
                </button>

                {isAdmin && (
                  <button
                    onClick={() => handleDeleteFile(file.id, file.file_path)}
                    className="text-sm bg-black text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No tuned files uploaded yet.</p>
        )}
      </div>

      {isAdmin && (
        <div className="bg-white text-black rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-4">Upload Tuned File</h2>

          <div className="space-y-4">
            <input
              type="file"
              onChange={(e) => setTunedFile(e.target.files?.[0] || null)}
              className="w-full border rounded-lg px-4 py-3"
            />

            <button
              onClick={handleTunedFileUpload}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Upload Tuned File
            </button>
          </div>
        </div>
      )}

      <div className="bg-white text-black rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Notes</h2>
        <p>{ticket.notes || "-"}</p>
      </div>

      <div className="bg-white text-black rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Status</h2>

        {isAdmin ? (
          <div className="space-y-4">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border rounded-lg px-4 py-3 w-full max-w-sm"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="paid">Paid</option>
            </select>

            <button
              onClick={handleStatusUpdate}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Save Status
            </button>
          </div>
        ) : (
          <span className="bg-red-600 text-white px-3 py-1 rounded-full">
            {ticket.status}
          </span>
        )}

        {message && <p className="text-sm text-gray-600 mt-4">{message}</p>}
      </div>

      {isAdmin && (
        <div className="bg-white text-black rounded-xl p-6 shadow-lg border-2 border-red-600">
          <h2 className="text-xl font-bold mb-4 text-red-600">Danger Zone</h2>
          <p className="text-sm text-gray-700 mb-4">
            This will delete the ticket and all linked file records.
          </p>

          <button
            onClick={handleDeleteTicket}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Delete Ticket
          </button>
        </div>
      )}
    </main>
  );
}