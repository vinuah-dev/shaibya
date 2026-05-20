"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Header from "@/components/layout/Header";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useGymLogo } from "@/lib/hooks/useGymLogo";
import { supabase } from "@/lib/supabaseClient";
import {
  ShoppingBag, ShoppingCart, Star, Package, Minus, Plus, X,
  Tag, Gift, History, ChevronDown, ChevronUp, CheckCircle,
  Percent, ArrowRight, RefreshCw, Clock, Truck, XCircle,
  Filter, Award, Search,
} from "lucide-react";

const CONDITIONS = {
  new: { label: "New", color: "emerald" },
  like_new: { label: "Like New", color: "green" },
  good: { label: "Good", color: "blue" },
  fair: { label: "Fair", color: "amber" },
  used: { label: "Used", color: "orange" },
};

const ORDER_STATUS_MAP = {
  pending: { label: "Pending", color: "amber", icon: Clock },
  confirmed: { label: "Confirmed", color: "blue", icon: CheckCircle },
  delivered: { label: "Delivered", color: "emerald", icon: Truck },
  cancelled: { label: "Cancelled", color: "red", icon: XCircle },
};

export default function CustomerShopPage() {
  const { user, selectedGym, isReady } = useAuthContext();
  const { showToast } = useToast();
  const gymLogo = useGymLogo();
  const [tab, setTab] = useState("shop"); // shop | cart | history
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState({}); // {item_id: qty}
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memberPoints, setMemberPoints] = useState(0);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [ratio, setRatio] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showRefurbishedOnly, setShowRefurbishedOnly] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const gymId = selectedGym?.id || user?.gym_id;
  const memberId = user?.member_id || user?.id;

  const apiCall = useCallback(async (url, body) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": user?.id || "" },
      body: JSON.stringify(body),
    });
    return res.json();
  }, [user?.id]);

  useEffect(() => {
    if (!gymId || !isReady) { if (isReady) setLoading(false); return; }
    const load = async () => {
      const [itemsJson, settingsJson] = await Promise.all([
        apiCall("/api/shop", { action: "list_items" }),
        apiCall("/api/referral", { action: "get_settings" }),
      ]);
      setItems(itemsJson.data || []);
      setRatio(settingsJson.data?.points_to_currency_ratio || 1);
      if (memberId) {
        const { data } = await supabase.from("members").select("points").eq("id", memberId).single();
        setMemberPoints(data?.points || 0);
      }
      setLoading(false);
    };
    load();
  }, [gymId, isReady, apiCall, memberId]);

  const fetchOrders = useCallback(async () => {
    if (!memberId) return;
    const json = await apiCall("/api/shop", { action: "member_orders", member_id: memberId });
    setOrders(json.data || []);
  }, [apiCall, memberId]);

  useEffect(() => { if (tab === "history") fetchOrders(); }, [tab, fetchOrders]);

  // Categories
  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category));
    return ["all", ...Array.from(cats)];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter(i => {
      if (selectedCategory !== "all" && i.category !== selectedCategory) return false;
      if (showRefurbishedOnly && !i.is_refurbished) return false;
      if (searchQuery && !i.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [items, selectedCategory, showRefurbishedOnly, searchQuery]);

  // Cart helpers
  const addToCart = (id) => {
    const item = items.find(i => i.id === id);
    if (item && item.stock !== -1 && (cart[id] || 0) >= item.stock) {
      showToast("Maximum stock reached", "error");
      return;
    }
    setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
  };
  const removeFromCart = (id) => setCart(c => { const n = { ...c }; if (n[id] > 1) n[id]--; else delete n[id]; return n; });
  const clearCart = () => setCart({});

  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([id, qty]) => {
      const item = items.find(i => i.id === id);
      return item ? { ...item, qty } : null;
    }).filter(Boolean);
  }, [cart, items]);

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const totalSavings = cartItems.reduce((s, i) => {
    if (i.original_price && i.original_price > i.price) {
      return s + (i.original_price - i.price) * i.qty;
    }
    return s;
  }, 0);
  const maxPointsDiscount = Math.min(memberPoints * ratio, subtotal);
  const maxPointsUsable = Math.floor(maxPointsDiscount / ratio);
  const pointsDiscount = Math.min(pointsToUse * ratio, subtotal);
  const total = Math.max(0, subtotal - pointsDiscount);
  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setProcessing(true);
    const json = await apiCall("/api/shop", {
      action: "place_order",
      member_id: memberId,
      items: cartItems.map(i => ({ item_id: i.id, qty: i.qty })),
      points_to_use: pointsToUse,
    });
    if (json.data?.order_id) {
      setOrderSuccess(json.data);
      setMemberPoints(p => Math.max(0, p - (json.data.points_used || 0)));
      clearCart();
      setPointsToUse(0);
      showToast("Order placed!", "success");
    } else {
      showToast(json.error || "Failed", "error");
    }
    setProcessing(false);
  };

  if (loading) return (<div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100"><Header title="Shop" gymLogo={gymLogo} /><div className="flex items-center justify-center py-20"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div></div>);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100 mb-17 safe-area-inset-bottom">
      <Header title="Shop" gymLogo={gymLogo} />
      <main className="px-3 py-2 space-y-3">

        {/* Points banner */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Star className="w-6 h-6" />
            <div><p className="text-xs text-amber-100">Your Points</p><p className="text-2xl font-black">{memberPoints.toLocaleString()}</p></div>
          </div>
          <div className="text-right text-xs text-amber-100">
            <p>1 pt = ₹{ratio}</p>
            <p className="font-bold text-white">= ₹{(memberPoints * ratio).toLocaleString()} value</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white rounded-xl shadow-sm border border-gray-100 relative">
          {[{ key: "shop", label: "Shop", icon: <ShoppingBag className="w-4 h-4" /> },
            { key: "cart", label: "Cart", icon: <ShoppingCart className="w-4 h-4" /> },
            { key: "history", label: "Orders", icon: <History className="w-4 h-4" /> }].map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setOrderSuccess(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === t.key ? "bg-blue-500 text-white shadow-md" : "text-gray-500"}`}>
              {t.icon} {t.label}
              {t.key === "cart" && cartCount > 0 && <span className={`px-1.5 rounded-full text-xs ${tab === "cart" ? "bg-white/30" : "bg-blue-100 text-blue-600"}`}>{cartCount}</span>}
            </button>
          ))}
        </div>

        {/* SHOP TAB */}
        {tab === "shop" && (<>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button onClick={() => setShowRefurbishedOnly(!showRefurbishedOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap flex items-center gap-1 ${showRefurbishedOnly ? "border-orange-400 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-500 bg-white"}`}>
              <RefreshCw className="w-3 h-3" /> Refurbished
            </button>
            {categories.map(c => (
              <button key={c} onClick={() => setSelectedCategory(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize whitespace-nowrap ${selectedCategory === c ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 bg-white"}`}>
                {c}</button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16"><ShoppingBag className="w-12 h-12 text-gray-300 mb-3" /><p className="text-gray-500 text-sm">No items available</p></div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filtered.map(item => {
                const inCart = cart[item.id] || 0;
                const cond = CONDITIONS[item.condition];
                const discountPct = item.original_price && item.price < item.original_price
                  ? Math.round((1 - item.price / item.original_price) * 100)
                  : 0;
                return (
                  <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                    {/* Discount badge */}
                    {discountPct > 0 && (
                      <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{discountPct}% OFF</div>
                    )}
                    {item.is_refurbished && (
                      <div className="absolute top-2 right-2 z-10 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <RefreshCw className="w-2.5 h-2.5" /> Refurbished
                      </div>
                    )}
                    <div className="h-44 bg-white flex items-center justify-center overflow-hidden p-4">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="max-w-full max-h-full object-contain drop-shadow-md" />
                      ) : (
                        <Package className="w-12 h-12 text-gray-200" />
                      )}
                    </div>
                    <div className="p-3 bg-gray-50/50 border-t border-gray-100">
                      <h3 className="font-bold text-gray-900 text-sm truncate">{item.name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-gray-400 capitalize">{item.category}</span>
                        {item.brand && <span className="text-[10px] text-gray-400">• {item.brand}</span>}
                      </div>
                      {item.is_refurbished && cond && (
                        <span className={`inline-block mt-1 text-[10px] bg-${cond.color}-50 text-${cond.color}-600 px-1.5 py-0.5 rounded-full`}>
                          {cond.label} condition
                        </span>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <p className="text-lg font-black text-gray-800">₹{item.price}</p>
                          {item.original_price && item.original_price > item.price && (
                            <p className="text-xs text-gray-400 line-through">₹{item.original_price}</p>
                          )}
                        </div>
                        
                        {inCart === 0 ? (
                          <button onClick={() => addToCart(item.id)}
                            className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center active:scale-90 transition-transform">
                            <Plus className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center"><Minus className="w-3.5 h-3.5" /></button>
                            <span className="text-sm font-bold w-6 text-center">{inCart}</span>
                            <button onClick={() => addToCart(item.id)} className="w-7 h-7 bg-blue-500 text-white rounded-lg flex items-center justify-center"><Plus className="w-3.5 h-3.5" /></button>
                          </div>
                        )}
                      </div>
                      {item.stock !== -1 && item.stock <= 5 && item.stock > 0 && (
                        <p className="text-[10px] text-red-500 font-medium mt-1">Only {item.stock} left!</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>)}

        {/* CART TAB */}
        {tab === "cart" && (<>
          {orderSuccess ? (
            <div className="flex flex-col items-center py-10">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4"><CheckCircle className="w-8 h-8 text-emerald-500" /></div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">Order Placed!</h3>
              <p className="text-gray-500 text-sm mb-4">Total: ₹{orderSuccess.final_amount}</p>
              {orderSuccess.points_used > 0 && <p className="text-amber-600 text-sm font-medium">-{orderSuccess.points_used} points used (₹{orderSuccess.points_discount} off)</p>}
              <button onClick={() => { setTab("shop"); setOrderSuccess(null); }} className="mt-4 px-6 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold">Continue Shopping</button>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="flex flex-col items-center py-16"><ShoppingCart className="w-12 h-12 text-gray-300 mb-3" /><p className="text-gray-500 text-sm">Cart is empty</p>
              <button onClick={() => setTab("shop")} className="mt-3 text-blue-500 text-sm font-medium">Browse items</button></div>
          ) : (<>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 truncate">{item.name}</p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-gray-400">₹{item.price} × {item.qty}</p>
                      {item.is_refurbished && <span className="text-[10px] bg-orange-100 text-orange-600 px-1 py-0.5 rounded">Refurb</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => removeFromCart(item.id)} className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center"><Minus className="w-3.5 h-3.5" /></button>
                    <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                    <button onClick={() => addToCart(item.id)} className="w-7 h-7 bg-blue-500 text-white rounded-lg flex items-center justify-center"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                  <p className="font-bold text-gray-800 w-16 text-right">₹{(item.price * item.qty).toFixed(0)}</p>
                </div>
              ))}
            </div>

            {/* Savings banner */}
            {totalSavings > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-500" />
                <p className="text-sm text-emerald-700 font-medium">You&apos;re saving ₹{totalSavings.toLocaleString()} on this order!</p>
              </div>
            )}

            {/* Points discount */}
            {memberPoints > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-amber-800 flex items-center gap-1.5"><Star className="w-4 h-4" /> Use Points for Discount</p>
                  <p className="text-xs text-amber-600">{memberPoints} pts available</p>
                </div>
                <input type="range" min={0} max={maxPointsUsable} value={pointsToUse} onChange={e => setPointsToUse(parseInt(e.target.value))}
                  className="w-full accent-amber-500" />
                <div className="flex justify-between mt-1 text-xs">
                  <span className="text-amber-600">Using {pointsToUse} points</span>
                  <span className="font-bold text-amber-800">-₹{pointsDiscount.toFixed(0)} off</span>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-medium">₹{subtotal.toFixed(0)}</span></div>
              {totalSavings > 0 && <div className="flex justify-between text-sm"><span className="text-emerald-600">Product Savings</span><span className="font-medium text-emerald-600">-₹{totalSavings.toFixed(0)}</span></div>}
              {pointsToUse > 0 && <div className="flex justify-between text-sm"><span className="text-amber-600">Points Discount</span><span className="font-medium text-amber-600">-₹{pointsDiscount.toFixed(0)}</span></div>}
              <div className="flex justify-between text-base font-bold border-t border-gray-100 pt-2"><span>Total</span><span>₹{total.toFixed(0)}</span></div>
            </div>

            <button onClick={handleCheckout} disabled={processing}
              className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-transform disabled:opacity-50 shadow-md flex items-center justify-center gap-2">
              {processing ? "Processing..." : <><ShoppingCart className="w-4 h-4" /> Place Order — ₹{total.toFixed(0)}</>}
            </button>
          </>)}
        </>)}

        {/* HISTORY TAB */}
        {tab === "history" && (<>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center py-16"><History className="w-12 h-12 text-gray-300 mb-3" /><p className="text-gray-500 text-sm">No orders yet</p></div>
          ) : (
            <div className="space-y-2">
              {orders.map(order => {
                const statusObj = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.pending;
                const StatusIcon = statusObj.icon;
                return (
                  <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <div className="flex justify-between mb-2">
                      <div>
                        <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                        <span className={`inline-flex items-center gap-1 mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-${statusObj.color}-50 text-${statusObj.color}-600`}>
                          <StatusIcon className="w-3 h-3" /> {statusObj.label}
                        </span>
                      </div>
                      <p className="text-base font-black text-gray-800">₹{order.final_amount}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {(order.shop_order_items || []).map((item, idx) => (
                        <span key={idx}>{item.shop_items?.name || "Item"} ×{item.quantity}{idx < (order.shop_order_items || []).length - 1 ? ", " : ""}</span>
                      ))}
                    </div>
                    {order.points_used > 0 && <p className="text-xs text-amber-600 mt-1">🌟 {order.points_used} points used (₹{order.discount_amount} off)</p>}
                    {(order.status === 'pending' || order.status === 'confirmed') && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={async () => {
                            if (!confirm('Cancel this order? Points will be refunded.')) return;
                            const json = await apiCall("/api/shop", { action: "update_order_status", order_id: order.id, status: "cancelled" });
                            if (json.success) {
                              showToast(`Order cancelled${json.points_refunded > 0 ? `. ${json.points_refunded} points refunded!` : ''}`, "success");
                              if (json.points_refunded > 0) setMemberPoints(p => p + json.points_refunded);
                              fetchOrders();
                            } else {
                              showToast(json.error || "Failed to cancel", "error");
                            }
                          }}
                          className="w-full py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg active:scale-95 transition-transform"
                        >
                          Cancel Order
                        </button>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </>)}

        <div className="h-4"></div>
      </main>
    </div>
  );
}
