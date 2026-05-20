import { NextResponse } from "next/server";
import { withAuth } from "@/lib/server/apiMiddleware";
import { blockViewOnlyWrites } from "@/lib/server/viewOnlyGuard";

export const POST = withAuth(async (request, { user, gymId, supabase, body }) => {
  const { params } = body;

  if (!params) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const writeBlocked = await blockViewOnlyWrites(request, supabase, user.id);
  if (writeBlocked) return writeBlocked;

  if (params.p_gym_id !== gymId) {
    return NextResponse.json({ error: "Forbidden: gym access denied" }, { status: 403 });
  }

  // Fetch the gym's plan_type to enforce basic plan restrictions
  const { data: gymData } = await supabase
    .from("gyms")
    .select("plan_type")
    .eq("id", params.p_gym_id)
    .single();

  const safeParams = {
    ...params,
    p_created_by: user.id,
    p_created_by_name: user.name,
    p_collected_by: user.id,
    p_collected_by_name: user.name,
  };

  // Basic plan gyms don't get member login credentials
  if (gymData && gymData.plan_type === 'basic') {
    safeParams.p_login_value = null;
    safeParams.p_default_password = null;
  }

  const { data, error } = await supabase.rpc("add_member_with_membership", safeParams);

  if (error) {
    const status = error.message?.includes("DUPLICATE_PHONE")
      ? 409
      : error.message?.includes("PAYMENT_EXCEEDS_MEMBERSHIP_TOTAL")
        ? 400
        : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ data });
});
