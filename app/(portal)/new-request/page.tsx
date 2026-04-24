"use client";

import { useState } from "react";
import { supabase } from "../../../src/lib/supabase";

export default function NewRequest() {
  const [registrationOrVin, setRegistrationOrVin] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleEngine, setVehicleEngine] = useState("");
  const [vehicleEcu, setVehicleEcu] = useState("");
  const [vehicleTransmission, setVehicleTransmission] = useState("");
  const [alreadyTuned, setAlreadyTuned] = useState("");
  const [tuningOption, setTuningOption] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [egrDelete, setEgrDelete] = useState(false);
  const [dpfOff, setDpfOff] = useState(false);
  const [speedLimiterDisable, setSpeedLimiterDisable] = useState(false);
  const [ecuClone, setEcuClone] = useState(false);
  const [patFluidOff, setPatFluidOff] = useState(false);
  const [dtcDisable, setDtcDisable] = useState(false);
  const [adblueOff, setAdblueOff] = useState(false);
  const [noxOff, setNoxOff] = useState(false);
  const [swirlFlapsOff, setSwirlFlapsOff] = useState(false);
  const [catOff, setCatOff] = useState(false);
  const [immoOff, setImmoOff] = useState(false);
  const [dieselHardCut, setDieselHardCut] = useState(false);
  const [petrolCrackles, setPetrolCrackles] = useState(false);

  const handleSubmit = async () => {
    if (loading) return;

    if (!registrationOrVin || !vehicleEcu) {
      setMessage("Registration/VIN and ECU are required");
      return;
    }

    setLoading(true);
    setMessage("Submitting...");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Not logged in");
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("company_name")
      .eq("id", user.id)
      .single();

    const companyName = profileData?.company_name || user.email;

    const { data: requestData, error: requestError } = await supabase
      .from("requests")
      .insert([
        {
          user_id: user.id,
          email: user.email,
          company_name: companyName,
          registration_or_vin: registrationOrVin,
          vehicle_make: vehicleMake,
          vehicle_model: vehicleModel,
          vehicle_engine: vehicleEngine,
          vehicle_ecu: vehicleEcu,
          vehicle_transmission: vehicleTransmission,
          already_tuned: alreadyTuned,
          tuning_option: tuningOption,
          egr_delete: egrDelete,
          dpf_off: dpfOff,
          speed_limiter_disable: speedLimiterDisable,
          ecu_clone: ecuClone,
          pat_fluid_off: patFluidOff,
          dtc_disable: dtcDisable,
          adblue_off: adblueOff,
          nox_off: noxOff,
          swirl_flaps_off: swirlFlapsOff,
          cat_off: catOff,
          immo_off: immoOff,
          diesel_hard_cut: dieselHardCut,
          petrol_crackles: petrolCrackles,
          notes,
          status: "pending",
          vehicle_reg: registrationOrVin,
        },
      ])
      .select()
      .single();

    if (requestError || !requestData) {
      setMessage(requestError?.message || "Failed to create ticket");
      setLoading(false);
      return;
    }

    if (file) {
      const fileName = `${user.id}/${requestData.id}/${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("ticket-files")
        .upload(fileName, file);

      if (uploadError) {
        setMessage(uploadError.message);
        setLoading(false);
        return;
      }

      const { error: fileError } = await supabase.from("request_files").insert([
        {
          request_id: requestData.id,
          user_id: user.id,
          file_path: fileName,
          file_type: "original",
        },
      ]);

      if (fileError) {
        setMessage(fileError.message);
        setLoading(false);
        return;
      }
    }

    await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        registration: registrationOrVin,
        company_name: companyName,
      }),
    });

    setMessage("Ticket submitted ✅");
    setLoading(false);
  };

  return (
    <main className="p-6">
      <div className="bg-white text-black rounded-xl p-8 shadow-xl w-full max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">New Ticket</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Registration / VIN *"
            value={registrationOrVin}
            onChange={(e) => setRegistrationOrVin(e.target.value)}
            className="w-full border rounded-lg px-4 py-3"
          />

          <input
            type="text"
            placeholder="Vehicle ECU *"
            value={vehicleEcu}
            onChange={(e) => setVehicleEcu(e.target.value)}
            className="w-full border rounded-lg px-4 py-3"
          />

          <input
            type="text"
            placeholder="Vehicle Make"
            value={vehicleMake}
            onChange={(e) => setVehicleMake(e.target.value)}
            className="w-full border rounded-lg px-4 py-3"
          />

          <input
            type="text"
            placeholder="Vehicle Model"
            value={vehicleModel}
            onChange={(e) => setVehicleModel(e.target.value)}
            className="w-full border rounded-lg px-4 py-3"
          />

          <input
            type="text"
            placeholder="Vehicle Engine"
            value={vehicleEngine}
            onChange={(e) => setVehicleEngine(e.target.value)}
            className="w-full border rounded-lg px-4 py-3"
          />

          <select
            value={vehicleTransmission}
            onChange={(e) => setVehicleTransmission(e.target.value)}
            className="w-full border rounded-lg px-4 py-3"
          >
            <option value="">Vehicle Transmission</option>
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
          </select>

          <select
            value={alreadyTuned}
            onChange={(e) => setAlreadyTuned(e.target.value)}
            className="w-full border rounded-lg px-4 py-3"
          >
            <option value="">Already Tuned?</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
            <option value="dont_know">Don't know</option>
          </select>

          <select
            value={tuningOption}
            onChange={(e) => setTuningOption(e.target.value)}
            className="w-full border rounded-lg px-4 py-3"
          >
            <option value="">Tuning Option</option>
            <option value="no_tuning">No Tuning (£110.18)</option>
            <option value="stage_1">Stage 1 (£135.05)</option>
            <option value="stage_2">Stage 2 (£220.32)</option>
          </select>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-bold mb-3">Add Ons</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <label>
              <input type="checkbox" checked={egrDelete} onChange={(e) => setEgrDelete(e.target.checked)} /> EGR delete
            </label>

            <label>
              <input type="checkbox" checked={dpfOff} onChange={(e) => setDpfOff(e.target.checked)} /> DPF off
            </label>

            <label>
              <input type="checkbox" checked={speedLimiterDisable} onChange={(e) => setSpeedLimiterDisable(e.target.checked)} /> Speed limiter disable
            </label>

            <label>
              <input type="checkbox" checked={ecuClone} onChange={(e) => setEcuClone(e.target.checked)} /> ECU Clone
            </label>

            <label>
              <input type="checkbox" checked={patFluidOff} onChange={(e) => setPatFluidOff(e.target.checked)} /> PAT Fluid off
            </label>

            <label>
              <input type="checkbox" checked={dtcDisable} onChange={(e) => setDtcDisable(e.target.checked)} /> DTC Disable
            </label>

            <label>
              <input type="checkbox" checked={adblueOff} onChange={(e) => setAdblueOff(e.target.checked)} /> Adblue off
            </label>

            <label>
              <input type="checkbox" checked={noxOff} onChange={(e) => setNoxOff(e.target.checked)} /> NOX off
            </label>

            <label>
              <input type="checkbox" checked={swirlFlapsOff} onChange={(e) => setSwirlFlapsOff(e.target.checked)} /> Swirl flaps off
            </label>

            <label>
              <input type="checkbox" checked={catOff} onChange={(e) => setCatOff(e.target.checked)} /> Cat off
            </label>

            <label>
              <input type="checkbox" checked={immoOff} onChange={(e) => setImmoOff(e.target.checked)} /> Immo off (+ £50)
            </label>

            {(tuningOption === "stage_1" || tuningOption === "stage_2") && (
              <label>
                <input type="checkbox" checked={dieselHardCut} onChange={(e) => setDieselHardCut(e.target.checked)} /> Diesel hard cut (+ £50)
              </label>
            )}

            {tuningOption === "stage_2" && catOff && (
              <label>
                <input type="checkbox" checked={petrolCrackles} onChange={(e) => setPetrolCrackles(e.target.checked)} /> Petrol crackles (+ £100)
              </label>
            )}
          </div>
        </div>

        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border rounded-lg px-4 py-3 mt-6 min-h-[120px]"
        />

        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full border rounded-lg px-4 py-3 mt-6"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Submit Ticket"}
        </button>

        {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
      </div>
    </main>
  );
}