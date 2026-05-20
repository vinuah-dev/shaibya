"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/contexts/ToastContext";
import { useUserRole } from "@/lib/hooks/useUserRole";

export default function GymSettingsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { canCreateTrainer, isLoading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [logoUrl, setLogoUrl] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [gymId, setGymId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    weekdayMorningStart: "06:00",
    weekdayMorningEnd: "12:00",
    weekdayEveningStart: "16:00",
    weekdayEveningEnd: "22:00",
    weekendMorningStart: "06:00",
    weekendMorningEnd: "12:00",
    weekendEveningStart: "16:00",
    weekendEveningEnd: "22:00",
    sundayOff: false,
    qrEnabled: true,
    qrType: "dynamic",
  });

  // Redirect trainers away from this page
  useEffect(() => {
    const role=JSON.parse(localStorage.getItem("gymUser")).role;
    console.log(role)
    if (role!="admin") {
      console.log("idar probelm haiiii")
      router.push("/admin/dashboard");
    }
  }, []);

  useEffect(() => {
    fetchGymData();
  }, []);

  const fetchGymData = async () => {
    try {
      setFetching(true);
      console.log("[GymSettings] fetchGymData: start");
      
      // Get gym ID from localStorage
      const storedGym = localStorage.getItem("selectedGym");
      console.log("[GymSettings] localStorage.selectedGym:", storedGym);
      if (!storedGym) {
        console.log("[GymSettings] No gym selected in localStorage");
        console.error("No gym selected");
        router.push("/admin/dashboard");
        return;
      }

      const gym = JSON.parse(storedGym);
      console.log("[GymSettings] Parsed gym:", gym);
      setGymId(gym.id);

      // Fetch gym data from database
      const { data: gymData, error } = await supabase
        .from("gyms")
        .select("*")
        .eq("id", gym.id)
        .single();

      if (error) {
        console.error("[GymSettings] supabase fetch error:", error);
        throw error;
      }

      if (gymData) {
        console.log("[GymSettings] Fetched gymData:", gymData);
        setFormData({
          name: gymData.name || "",
          address: gymData.address || "",
          phone: gymData.phone || "",
          email: gymData.email || "",
          website: gymData.website || "",
          weekdayMorningStart: gymData.weekday_morning_start || "06:00",
          weekdayMorningEnd: gymData.weekday_morning_end || "12:00",
          weekdayEveningStart: gymData.weekday_evening_start || "16:00",
          weekdayEveningEnd: gymData.weekday_evening_end || "22:00",
          weekendMorningStart: gymData.weekend_morning_start || "06:00",
          weekendMorningEnd: gymData.weekend_morning_end || "12:00",
          weekendEveningStart: gymData.weekend_evening_start || "16:00",
          weekendEveningEnd: gymData.weekend_evening_end || "22:00",
          sundayOff: gymData.sunday_off || false,
          qrEnabled: gymData.qr_enabled !== null ? gymData.qr_enabled : true,
         qrType: gymData.qr_type || "dynamic",
        });
        setLogoUrl(gymData.logo_url || null);  
      }
    } catch (error) {
      console.error("[GymSettings] Error fetching gym data:", error);
      showError("Failed to load gym settings");
    } finally {
      console.log("[GymSettings] fetchGymData: end");
      setFetching(false);
    }
  };
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !gymId) return;

    setUploadingLogo(true);
    try {
      const filePath = `${gymId}/logo.png`;

      const { error: uploadError } = await supabase.storage
        .from("gym-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("gym-logos")
        .getPublicUrl(filePath);

      const freshUrl = `${data.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("gyms")
        .update({ logo_url: freshUrl })
        .eq("id", gymId);

      if (updateError) throw updateError;

      setLogoUrl(freshUrl);

      // Update localStorage so navbar picks it up
      const storedGym = localStorage.getItem("selectedGym");
      if (storedGym) {
        const gym = JSON.parse(storedGym);
        gym.logo_url = freshUrl;
        localStorage.setItem("selectedGym", JSON.stringify(gym));
      }

      showSuccess("Logo uploaded successfully!");
    } catch (error) {
      console.error("Logo upload error:", error);
      showError("Failed to upload logo. Please try again.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const updateForm = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!gymId) return;
    console.log("[GymSettings] handleSubmit: start", { gymId, formData });

    // Validate phone number if provided
    if (formData.phone && formData.phone.trim() !== '') {
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        showError("Please enter a valid 10-digit phone number");
        return;
      }
    }

    // Validate email format if provided
    if (formData.email && formData.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        showError("Please enter a valid email address");
        return;
      }
    }

    setLoading(true);
    try {
      // Check if gym name already exists (excluding current gym)
      const { data: existingGym, error: checkError } = await supabase
        .from("gyms")
        .select("id, name")
        .eq("name", formData.name.trim())
        .neq("id", gymId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is what we want
        throw checkError;
      }

      if (existingGym) {
        showError("Gym name already exists. Please choose a different name.");
        setLoading(false);
        return;
      }
      // Get current user for updated_by
      const storedUser = localStorage.getItem("gymUser");
      const user = storedUser ? JSON.parse(storedUser) : null;
      console.log("[GymSettings] current user:", user);

      // Clean phone number (remove non-digits)
      const cleanPhone = formData.phone ? formData.phone.replace(/\D/g, '') : null;
      console.log("[GymSettings] cleanPhone:", cleanPhone);

      const updatePayload = {
        name: formData.name,
        address: formData.address,
        phone: cleanPhone || null,
        email: formData.email?.trim() || null,
        website: formData.website?.trim() || null,
        weekday_morning_start: formData.weekdayMorningStart,
        weekday_morning_end: formData.weekdayMorningEnd,
        weekday_evening_start: formData.weekdayEveningStart,
        weekday_evening_end: formData.weekdayEveningEnd,
        weekend_morning_start: formData.weekendMorningStart,
        weekend_morning_end: formData.weekendMorningEnd,
        weekend_evening_start: formData.weekendEveningStart,
        weekend_evening_end: formData.weekendEveningEnd,
        sunday_off: formData.sundayOff,
        qr_enabled: formData.qrEnabled,
        qr_type: formData.qrType,
        updated_by: user?.id || null,
      };
      console.log("[GymSettings] update payload:", updatePayload);

      const { error } = await supabase
        .from("gyms")
        .update(updatePayload)
        .eq("id", gymId);

      if (error) {
        console.error("[GymSettings] supabase update error:", error);
        throw error;
      }
      console.log("[GymSettings] update success for gym:", gymId);

      // Update localStorage with new gym name
      const storedGym = localStorage.getItem("selectedGym");
      if (storedGym) {
        const gym = JSON.parse(storedGym);
        gym.name = formData.name;
        localStorage.setItem("selectedGym", JSON.stringify(gym));
        console.log("[GymSettings] localStorage.selectedGym updated:", gym);
      }

      showSuccess("Settings saved successfully!");
    } catch (error) {
      console.error("[GymSettings] Error saving gym settings:", error);
      showError("Failed to save settings. Please try again.");
    } finally {
      console.log("[GymSettings] handleSubmit: end");
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <Header title="Gym Settings" showBack={true} />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="Gym Settings" showBack={true} />

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
        {/* Basic Info */}
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900">Basic Information</h3>
          {/* Logo Upload */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Gym Logo" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <span className="text-2xl">🏢</span>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Gym Logo</p>
              <p className="text-xs text-gray-500 mb-2">Appears in the navbar for your gym</p>
              <label className="inline-block px-4 py-2 bg-black text-white text-xs font-medium rounded-lg cursor-pointer active:scale-95 transition-transform">
                {uploadingLogo ? "Uploading..." : logoUrl ? "Change Logo" : "Upload Logo"}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  hidden
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gym Name *
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none"
              value={formData.name}
              onChange={(e) => updateForm("name", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <textarea
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none resize-none"
              rows={2}
              value={formData.address}
              onChange={(e) => updateForm("address", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#F97316]/50 focus:border-[#F97316]/50"
                placeholder="Enter 10-digit phone number"
                value={formData.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 10) {
                    updateForm("phone", value);
                  }
                }}
                pattern="[0-9]{10}"
                maxLength="10"
                title="Please enter a valid 10-digit phone number"
              />
              <p className="text-xs text-gray-500 mt-1">Enter 10 digits only (optional)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#F97316]/50 focus:border-[#F97316]/50"
                placeholder="example@email.com"
                value={formData.email}
                onChange={(e) => updateForm("email", e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Optional - for contact information</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none"
              placeholder="https://"
              value={formData.website}
              onChange={(e) => updateForm("website", e.target.value)}
            />
          </div>
        </div>

        {/* Operating Hours */}
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900">Operating Hours</h3>

          {/* Weekdays */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weekdays (Mon - Fri)
            </label>
            
            {/* Morning Shift */}
            <div className="mb-3">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Morning Shift</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Start</label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#F97316]/50 focus:border-[#F97316]/50"
                    value={formData.weekdayMorningStart}
                    onChange={(e) => updateForm("weekdayMorningStart", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">End</label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#F97316]/50 focus:border-[#F97316]/50"
                    value={formData.weekdayMorningEnd}
                    onChange={(e) => updateForm("weekdayMorningEnd", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Evening Shift */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Evening Shift</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Start</label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#F97316]/50 focus:border-[#F97316]/50"
                    value={formData.weekdayEveningStart}
                    onChange={(e) => updateForm("weekdayEveningStart", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">End</label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#F97316]/50 focus:border-[#F97316]/50"
                    value={formData.weekdayEveningEnd}
                    onChange={(e) => updateForm("weekdayEveningEnd", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Weekends */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Weekends {formData.sundayOff ? "(Saturday Only)" : "(Sat - Sun)"}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Sunday Off</span>
                <button
                  type="button"
                  onClick={() => updateForm("sundayOff", !formData.sundayOff)}
                  className={`w-11 h-6 rounded-full transition ${
                    formData.sundayOff ? "bg-orange-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition transform ${
                      formData.sundayOff ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  ></div>
                </button>
              </div>
            </div>
            
            {/* Morning Shift */}
            <div className="mb-3">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Morning Shift</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Start</label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#F97316]/50 focus:border-[#F97316]/50"
                    value={formData.weekendMorningStart}
                    onChange={(e) => updateForm("weekendMorningStart", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">End</label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#F97316]/50 focus:border-[#F97316]/50"
                    value={formData.weekendMorningEnd}
                    onChange={(e) => updateForm("weekendMorningEnd", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Evening Shift */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Evening Shift</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Start</label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#F97316]/50 focus:border-[#F97316]/50"
                    value={formData.weekendEveningStart}
                    onChange={(e) => updateForm("weekendEveningStart", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">End</label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#F97316]/50 focus:border-[#F97316]/50"
                    value={formData.weekendEveningEnd}
                    onChange={(e) => updateForm("weekendEveningEnd", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Settings */}
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">QR Code Attendance</h3>
            <button
              type="button"
              onClick={() => updateForm("qrEnabled", !formData.qrEnabled)}
              className={`w-12 h-6 rounded-full transition ${
                formData.qrEnabled ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition transform ${
                  formData.qrEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              ></div>
            </button>
          </div>

          {formData.qrEnabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  QR Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {["static", "dynamic"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateForm("qrType", type)}
                      className={`py-3 rounded-xl text-sm font-medium capitalize ${
                        formData.qrType === type
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {formData.qrType === "dynamic"
                    ? "QR changes every 5 minutes for security"
                    : "Single QR code for all attendance"}
                </p>
              </div>

              {/* QR Preview */}
              <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center">
                <div className="w-32 h-32 bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center mb-3">
                  <span className="text-4xl">📱</span>
                </div>
                <button
                  type="button"
                  className="text-sm text-blue-600 font-medium"
                >
                  Generate New QR
                </button>
              </div>
            </>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-black text-white rounded-xl font-medium disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
