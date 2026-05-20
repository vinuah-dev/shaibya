import { NextResponse } from "next/server";
import { withAuth } from "@/lib/server/apiMiddleware";

export const POST = withAuth(async (request, { gymId, supabase, user, body }) => {
  const action = body?.action;

  // ─── List shop items ───────────────────────────────────
  if (action === "list_items") {
    let query = supabase
      .from("shop_items")
      .select("*")
      .eq("gym_id", gymId)
      .order("created_at", { ascending: false });

    // Only active items for customers
    if (body.active_only !== false) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }

  // ─── Add item ──────────────────────────────────────────
  if (action === "add_item") {
    const { data, error } = await supabase
      .from("shop_items")
      .insert({
        gym_id: gymId,
        name: body.name,
        description: body.description || null,
        price: body.price,
        original_price: body.original_price || null,
        image_url: body.image_url || null,
        category: body.category || "general",
        condition: body.condition || "new",
        brand: body.brand || null,
        stock: body.stock ?? -1,
        is_active: true,
        is_refurbished: body.is_refurbished || false,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }

  // ─── Update item ───────────────────────────────────────
  if (action === "update_item") {
    const updates = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.price !== undefined) updates.price = body.price;
    if (body.original_price !== undefined) updates.original_price = body.original_price;
    if (body.image_url !== undefined) updates.image_url = body.image_url;
    if (body.category !== undefined) updates.category = body.category;
    if (body.condition !== undefined) updates.condition = body.condition;
    if (body.brand !== undefined) updates.brand = body.brand;
    if (body.stock !== undefined) updates.stock = body.stock;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.is_refurbished !== undefined) updates.is_refurbished = body.is_refurbished;
    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("shop_items")
      .update(updates)
      .eq("id", body.item_id)
      .eq("gym_id", gymId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // ─── Delete item ───────────────────────────────────────
  if (action === "delete_item") {
    const { error } = await supabase
      .from("shop_items")
      .delete()
      .eq("id", body.item_id)
      .eq("gym_id", gymId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // ─── Upload product image ─────────────────────────────
  if (action === "get_upload_url") {
    const filePath = `${gymId}/products/${body.item_id || Date.now()}.jpg`;
    const { data } = supabase.storage
      .from("shop-images")
      .getPublicUrl(filePath);
    return NextResponse.json({ data: { path: filePath, publicUrl: `${data.publicUrl}?t=${Date.now()}` } });
  }

  // ─── Process order (with points discount) ──────────────
  if (action === "place_order") {
    const { data, error } = await supabase.rpc("process_shop_order", {
      p_gym_id: gymId,
      p_member_id: body.member_id,
      p_items: body.items, // [{item_id, qty}]
      p_points_to_use: body.points_to_use || 0,
      p_processed_by: user?.id || null,
      p_processed_by_name: user?.name || null,
      p_notes: body.notes || null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (data?.error) return NextResponse.json({ error: data.error }, { status: 400 });
    return NextResponse.json({ data });
  }

  // ─── Update order status ───────────────────────────────
  if (action === "update_order_status") {
    if (body.status === "cancelled") {
      const { data, error } = await supabase.rpc("cancel_shop_order", {
        p_order_id: body.order_id,
        p_cancelled_by: user?.id || null,
        p_cancelled_by_name: user?.name || "Admin",
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (data?.error) return NextResponse.json({ error: data.error }, { status: 400 });
      return NextResponse.json({ success: true, points_refunded: data.points_refunded });
    }
    const { error } = await supabase
      .from("shop_orders")
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq("id", body.order_id)
      .eq("gym_id", gymId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }
  
  // ─── Get member's order history ────────────────────────
  if (action === "member_orders") {
    const { data, error } = await supabase
      .from("shop_orders")
      .select(`
        *,
        shop_order_items(
          *,
          shop_items(name, image_url, condition)
        )
      `)
      .eq("member_id", body.member_id)
      .eq("gym_id", gymId)
      .order("created_at", { ascending: false })
      .limit(body.limit || 20);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }

  // ─── Get all orders for gym (admin) ────────────────────
  if (action === "all_orders") {
    let query = supabase
      .from("shop_orders")
      .select(`
        *,
        members(full_name, phone),
        shop_order_items(
          *,
          shop_items(name, image_url, condition)
        )
      `)
      .eq("gym_id", gymId)
      .order("created_at", { ascending: false });

    if (body.status && body.status !== "all") {
      query = query.eq("status", body.status);
    }

    query = query.limit(body.limit || 50);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }

  // ─── Get shop analytics ────────────────────────────────
  if (action === "analytics") {
    const [ordersRes, itemsRes] = await Promise.all([
      supabase
        .from("shop_orders")
        .select("id, final_amount, points_used, discount_amount, status, created_at")
        .eq("gym_id", gymId)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("shop_items")
        .select("id, name, category, price, stock, is_active, is_refurbished")
        .eq("gym_id", gymId),
    ]);

    const orders = ordersRes.data || [];
    const items = itemsRes.data || [];

    const totalRevenue = orders
      .filter(o => o.status !== "cancelled")
      .reduce((s, o) => s + parseFloat(o.final_amount || 0), 0);
    const totalOrders = orders.filter(o => o.status !== "cancelled").length;
    const totalPointsUsed = orders.reduce((s, o) => s + (o.points_used || 0), 0);
    const activeItems = items.filter(i => i.is_active).length;
    const refurbishedItems = items.filter(i => i.is_refurbished).length;
    const lowStockItems = items.filter(i => i.stock !== -1 && i.stock > 0 && i.stock <= 5);

    return NextResponse.json({
      data: {
        totalRevenue,
        totalOrders,
        totalPointsUsed,
        activeItems,
        totalItems: items.length,
        refurbishedItems,
        lowStockItems,
        avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      },
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}, { allowBodyUserId: true });
