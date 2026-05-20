"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNotification } from "@/contexts/NotificationContext";

export default function Header({ title, showBack = true, gymLogo = null }) {
  const router = useRouter();
  const { unreadCount, clearUnread, items } = useNotification();

  const [open, setOpen] = useState(false);
  const [localLogo, setLocalLogo] = useState(null);

  const toggleOpen = () => {
    setOpen((v) => !v);
    clearUnread();
  };

  // Gym logo fallback: try localStorage if no prop passed
  useEffect(() => {
    if (gymLogo) return;

    const storedGym = localStorage.getItem("selectedGym");
    if (storedGym) {
      try {
        const gym = JSON.parse(storedGym);
        if (gym.logo_url) {
          setLocalLogo(gym.logo_url);
          return;
        }
      } catch (e) {
        console.error("Error parsing selectedGym", e);
      }
    }

    // Member fallback — fetch from Supabase
    const storedMember = localStorage.getItem("member");
    if (storedMember) {
      try {
        const member = JSON.parse(storedMember);
        const fetchMemberLogo = async () => {
          const { supabase } = await import("@/lib/supabaseClient");
          const { data } = await supabase
            .from("members")
            .select("gym_id")
            .eq("id", member.id)
            .single();
          if (data?.gym_id) {
            const { data: gymData } = await supabase
              .from("gyms")
              .select("logo_url")
              .eq("id", data.gym_id)
              .single();
            if (gymData?.logo_url) {
              setLocalLogo(gymData.logo_url);
            }
          }
        };
        fetchMemberLogo();
      } catch (e) {
        console.error("Error fetching member logo", e);
      }
    }
  }, [gymLogo]);

  const displayLogo = gymLogo || localLogo;

  return (
    <header className="sticky top-0 bg-white border-b border-gray-100 z-50">
      <div className="flex items-center justify-between px-4 py-4 relative">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition text-gray-700 text-2xl font-bold min-w-[40px] flex items-center justify-center"
              aria-label="Go back"
            >
              ←
            </button>
          )}
          {displayLogo && (
            <img
              src={displayLogo}
              alt="Gym Logo"
              className="h-9 w-9 rounded-lg object-cover"
            />
          )}
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        </div>
        <button
          className="relative p-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
          aria-label="Notifications"
          onClick={toggleOpen}
          type="button"
          role="button"
          tabIndex={0}
        >
          <span role="img" aria-label="bell">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full px-1.5 py-[2px] min-w-[20px] text-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
        {open && (
          <div className="absolute right-4 top-14 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-[60]">
            <div className="p-3 border-b font-semibold text-gray-800">Notifications</div>
            <div className="max-h-64 overflow-auto">
              {items && items.length > 0 ? (
                items.map((n) => (
                  <div key={n.id} className="px-3 py-2 hover:bg-gray-50">
                    <div className="text-sm font-medium text-gray-900">{n.title}</div>
                    {n.body && (<div className="text-xs text-gray-600">{n.body}</div>)}
                    <div className="text-[10px] text-gray-400 mt-1">{new Date(n.receivedAt).toLocaleString()}</div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-sm text-gray-600">No notifications</div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
