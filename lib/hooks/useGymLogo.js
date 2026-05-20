"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useGymLogo() {
  const [gymLogo, setGymLogo] = useState(null);

  useEffect(() => {
    const fetchLogo = async () => {
      // Try admin gym first
      const storedGym = localStorage.getItem("selectedGym");
      if (storedGym) {
        try {
          const gym = JSON.parse(storedGym);
          if (gym.logo_url) {
            setGymLogo(gym.logo_url);
            return;
          }
        } catch (e) {
          console.error("Error parsing selectedGym", e);
        }
      }

      // Try member gym
      const storedMember = localStorage.getItem("member");
      if (storedMember) {
        try {
          const member = JSON.parse(storedMember);
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
              setGymLogo(gymData.logo_url);
            }
          }
        } catch (e) {
          console.error("Error fetching member logo", e);
        }
      }
    };

    fetchLogo();
  }, []);

  return gymLogo;
}
