"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Header from "@/components/layout/Header";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { supabase } from "@/lib/supabaseClient";
import {
  ShoppingBag, Plus, X, Edit3, Trash2, Package, DollarSign,
  Tag, Archive, Eye, EyeOff, Settings, Gift, Users, Star,
  ChevronDown, ChevronUp, AlertTriangle, Search, Hash,
  Percent, TrendingUp, ShoppingCart, Camera, BarChart3,
  RefreshCw, Clock, CheckCircle, XCircle, Truck, Filter,
  Image as ImageIcon, Award,
} from "lucide-react";

const CATEGORIES = ["general", "supplements", "apparel", "equipment", "beverages", "snacks", "accessories"];
const CONDITIONS = [
  { value: "new", label: "New", color: "emerald" },
  { value: "like_new", label: "Like New", color: "green" },
  { value: "good", label: "Good", color: "blue" },
  { value: "fair", label: "Fair", color: "amber" },
  { value: "used", label: "Used", color: "orange" },
];
const ORDER_STATUSES = [
  { value: "pending", label: "Pending", color: "amber", icon: Clock },
  { value: "confirmed", label: "Confirmed", color: "blue", icon: CheckCircle },
  { value: "delivered", label: "Delivered", color: "emerald", icon: Truck },
  { value: "cancelled", label: "Cancelled", color: "red", icon: XCircle },
];

// ─── Add/Edit Item Modal ─────────────────────────────────────
function ItemModal({ open, onClose, onSave, editItem, gymId }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [category, setCategory] = useState("general");
  const [condition, setCondition] = useState("new");
  const [brand, setBrand] = useState("");
  const [stock, setStock] = useState("");
  const [unlimited, setUnlimited] = useState(true);
  const [isRefurbished, setIsRefurbished] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editItem) {
      setName(editItem.name || "");
      setDescription(editItem.description || "");
      setPrice(editItem.price || "");
      setOriginalPrice(editItem.original_price || "");
      setCategory(editItem.category || "general");
      setCondition(editItem.condition || "new");
      setBrand(editItem.brand || "");
      setStock(editItem.stock === -1 ? "" : editItem.stock || "");
      setUnlimited(editItem.stock === -1);
      setIsRefurbished(editItem.is_refurbished || false);
      setImageUrl(editItem.image_url || "");
    } else {
      setName(""); setDescription(""); setPrice(""); setOriginalPrice("");
      setCategory("general"); setCondition("new"); setBrand(""); setStock("");
      setUnlimited(true); setIsRefurbished(false); setImageUrl("");
    }
  }, [editItem, open]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !gymId) return;
    setUploading(true);
    try {
      const filePath = `${gymId}/products/${Date.now()}_${file.name.replace(/\s/g, "_")}`;
      const { error: uploadError } = await supabase.storage
        .from("shop-images")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("shop-images").getPublicUrl(filePath);
      setImageUrl(`${data.publicUrl}?t=${Date.now()}`);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  const handleSave = async () => {
    if (!name.trim() || !price) return;
    setSaving(true);
    await onSave({
      name: name.trim(), description: description.trim(),
      price: parseFloat(price),
      original_price: originalPrice ? parseFloat(originalPrice) : null,
      category: category.trim(),
      condition,
      brand: brand.trim() || null,
      stock: unlimited ? -1 : parseInt(stock) || 0,
      is_refurbished: isRefurbished,
      image_url: imageUrl || null,
      ...(editItem ? { item_id: editItem.id } : {}),
    });
    setSaving(false); onClose();
  };

  const discountPercent = originalPrice && price && parseFloat(originalPrice) > parseFloat(price)
    ? Math.round((1 - parseFloat(price) / parseFloat(originalPrice)) * 100)
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">{editItem ? "Edit Item" : "Add Item"}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          {/* Image Upload */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Product Image</label>
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
                {imageUrl ? (
                  <img src={imageUrl} alt="Product" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-gray-300" />
                )}
              </div>
              <div>
                <label className="inline-block px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg cursor-pointer active:scale-95 transition-transform">
                  {uploading ? "Uploading..." : imageUrl ? "Change" : "Upload"}
                  <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} hidden />
                </label>
                {imageUrl && <button onClick={() => setImageUrl("")} className="ml-2 text-xs text-red-500">Remove</button>}
              </div>
            </div>
          </div>

          <div><label className="text-xs font-medium text-gray-500 mb-1 block">Item Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Protein Shake"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>

          <div><label className="text-xs font-medium text-gray-500 mb-1 block">Brand</label>
            <input type="text" value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. MuscleBlaze"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>

          <div><label className="text-xs font-medium text-gray-500 mb-1 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Optional description"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" /></div>

          {/* Refurbished toggle */}
          <label className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl cursor-pointer">
            <input type="checkbox" checked={isRefurbished} onChange={e => setIsRefurbished(e.target.checked)} className="rounded accent-orange-500" />
            <div>
              <span className="text-sm font-medium text-orange-800">Refurbished / Pre-owned</span>
              <p className="text-xs text-orange-600">Mark this as a refurbished or second-hand item</p>
            </div>
            <RefreshCw className="w-4 h-4 text-orange-500 ml-auto" />
          </label>

          {/* Condition */}
          {isRefurbished && (
            <div><label className="text-xs font-medium text-gray-500 mb-2 block">Condition</label>
              <div className="flex flex-wrap gap-1.5">
                {CONDITIONS.map(c => (
                  <button key={c.value} onClick={() => setCondition(c.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${condition === c.value ? `border-${c.color}-400 bg-${c.color}-50 text-${c.color}-700` : "border-gray-200 text-gray-500"}`}>
                    {c.label}</button>
                ))}
              </div></div>
          )}

          {/* Price */}
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">Selling Price (₹) *</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">Original Price (₹)</label>
              <input type="number" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} placeholder="MRP"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
          </div>
          {discountPercent > 0 && (
            <p className="text-xs text-emerald-600 font-medium">✨ {discountPercent}% off from original price</p>
          )}

          <div><label className="text-xs font-medium text-gray-500 mb-2 block">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize ${category === c ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500"}`}>
                  {c}</button>
              ))}
            </div></div>

          <div><label className="text-xs font-medium text-gray-500 mb-1 block">Stock</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={unlimited} onChange={e => setUnlimited(e.target.checked)} className="rounded" />
                Unlimited
              </label>
              {!unlimited && <input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="Qty"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm" />}
            </div></div>

          <button onClick={handleSave} disabled={!name.trim() || !price || saving}
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold text-sm active:scale-95 disabled:opacity-50">
            {saving ? "Saving..." : editItem ? "Update Item" : "Add Item"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Referral Settings Modal ─────────────────────────────────
function ReferralSettingsModal({ open, onClose, settings, onSave }) {
  const [pointsPerReferral, setPointsPerReferral] = useState(settings?.points_per_referral || 50);
  const [ratio, setRatio] = useState(settings?.points_to_currency_ratio || 1);
  const [active, setActive] = useState(settings?.is_active !== false);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-blue-500" /> Reward Settings</h3>
        <div className="space-y-3">
          <div><label className="text-xs font-medium text-gray-500 mb-1 block">Points per Referral</label>
            <input type="number" value={pointsPerReferral} onChange={e => setPointsPerReferral(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" /></div>
          <div><label className="text-xs font-medium text-gray-500 mb-1 block">Points to ₹ Ratio (1 point = ₹___)</label>
            <input type="number" step="0.1" value={ratio} onChange={e => setRatio(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
            <p className="text-xs text-gray-400 mt-1">Example: 1.0 means 100 points = ₹100 discount</p></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="rounded" /> Referral system active</label>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium">Cancel</button>
            <button onClick={async () => { setSaving(true); await onSave({ points_per_referral: pointsPerReferral, points_to_currency_ratio: ratio, is_active: active }); setSaving(false); onClose(); }}
              disabled={saving} className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium">{saving ? "Saving..." : "Save"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Analytics Card ──────────────────────────────────────────
function AnalyticsPanel({ analytics }) {
  if (!analytics) return null;
  const cards = [
    { label: "Total Revenue", value: `₹${analytics.totalRevenue?.toLocaleString() || 0}`, icon: DollarSign, color: "emerald" },
    { label: "Total Orders", value: analytics.totalOrders || 0, icon: ShoppingCart, color: "blue" },
    { label: "Avg Order Value", value: `₹${Math.round(analytics.avgOrderValue || 0)}`, icon: TrendingUp, color: "indigo" },
    { label: "Active Items", value: analytics.activeItems || 0, icon: Package, color: "purple" },
    { label: "Refurbished", value: analytics.refurbishedItems || 0, icon: RefreshCw, color: "orange" },
    { label: "Points Redeemed", value: analytics.totalPointsUsed?.toLocaleString() || 0, icon: Star, color: "amber" },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {cards.map((c, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
            <c.icon className={`w-4 h-4 text-${c.color}-500 mx-auto mb-1`} />
            <p className="text-lg font-black text-gray-800">{c.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>
      {analytics.lowStockItems?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-1"><AlertTriangle className="w-3.5 h-3.5" /> Low Stock Alert</p>
          <div className="text-xs text-amber-700">
            {analytics.lowStockItems.map((item, i) => (
              <span key={item.id}>{item.name} ({item.stock} left){i < analytics.lowStockItems.length - 1 ? ", " : ""}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function AdminShopPage() {
  const { user, selectedGym, isReady } = useAuthContext();
  const { showToast } = useToast();
  const [tab, setTab] = useState("items"); // items | orders | analytics
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterRefurbished, setFilterRefurbished] = useState("all"); // all | new | refurbished
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");

  const gymId = selectedGym?.id;

  const apiCall = useCallback(async (url, body) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": user?.id || "" },
      body: JSON.stringify(body),
    });
    return res.json();
  }, [user?.id]);

  const fetchItems = useCallback(async () => {
    const json = await apiCall("/api/shop", { action: "list_items", active_only: false });
    setItems(json.data || []);
  }, [apiCall]);

  const fetchOrders = useCallback(async () => {
    const json = await apiCall("/api/shop", { action: "all_orders", limit: 50, status: orderStatusFilter !== "all" ? orderStatusFilter : undefined });
    setOrders(json.data || []);
  }, [apiCall, orderStatusFilter]);

  const fetchSettings = useCallback(async () => {
    const json = await apiCall("/api/referral", { action: "get_settings" });
    setSettings(json.data);
  }, [apiCall]);

  const fetchAnalytics = useCallback(async () => {
    const json = await apiCall("/api/shop", { action: "analytics" });
    setAnalytics(json.data);
  }, [apiCall]);

  useEffect(() => {
    if (gymId && isReady) {
      Promise.all([fetchItems(), fetchSettings()]).then(() => setLoading(false));
    } else if (isReady) setLoading(false);
  }, [gymId, isReady, fetchItems, fetchSettings]);

  useEffect(() => { if (tab === "orders") fetchOrders(); }, [tab, fetchOrders]);
  useEffect(() => { if (tab === "analytics") fetchAnalytics(); }, [tab, fetchAnalytics]);

  const handleSaveItem = async (data) => {
    const action = data.item_id ? "update_item" : "add_item";
    const json = await apiCall("/api/shop", { action, ...data });
    if (json.success || json.data) { showToast(data.item_id ? "Item updated" : "Item added", "success"); fetchItems(); }
    else showToast(json.error || "Failed", "error");
  };

  const handleDeleteItem = async (id) => {
    const json = await apiCall("/api/shop", { action: "delete_item", item_id: id });
    if (json.success) { showToast("Item deleted", "success"); fetchItems(); }
    else showToast(json.error || "Failed", "error");
    setConfirmDelete(null);
  };

  const handleToggleItem = async (item) => {
    await apiCall("/api/shop", { action: "update_item", item_id: item.id, is_active: !item.is_active });
    fetchItems();
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    const json = await apiCall("/api/shop", { action: "update_order_status", order_id: orderId, status });
    if (json.success) { showToast(`Order ${status}`, "success"); fetchOrders(); }
    else showToast(json.error || "Failed", "error");
  };

  const handleSaveSettings = async (data) => {
    const json = await apiCall("/api/referral", { action: "update_settings", ...data });
    if (json.success) { showToast("Settings saved", "success"); fetchSettings(); }
    else showToast(json.error || "Failed", "error");
  };

  const filtered = useMemo(() => {
    return items.filter(i => {
      if (searchQuery && !i.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterCategory !== "all" && i.category !== filterCategory) return false;
      if (filterRefurbished === "refurbished" && !i.is_refurbished) return false;
      if (filterRefurbished === "new" && i.is_refurbished) return false;
      return true;
    });
  }, [items, searchQuery, filterCategory, filterRefurbished]);

  if (loading) return (<div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100"><Header title="Shop" /><div className="flex items-center justify-center py-20"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div></div>);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 mb-17 safe-area-inset-bottom">
      <Header title="Shop Management" gymLogo={selectedGym?.logo_url} />
      <main className="px-3 py-2 space-y-3">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white rounded-xl shadow-sm border border-gray-100">
          {[
            { key: "items", label: "Items", icon: <Package className="w-4 h-4" /> },
            { key: "orders", label: "Orders", icon: <ShoppingCart className="w-4 h-4" /> },
            { key: "analytics", label: "Stats", icon: <BarChart3 className="w-4 h-4" /> },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === t.key ? "bg-blue-500 text-white shadow-md" : "text-gray-500"}`}>
              {t.icon} {t.label}
            </button>
          ))}
          <button onClick={() => setShowSettings(true)} className="px-3 py-2.5 rounded-lg text-gray-400"><Settings className="w-4 h-4" /></button>
        </div>

        {/* ITEMS TAB */}
        {tab === "items" && (<>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search items..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <button onClick={() => { setEditItem(null); setShowItemModal(true); }}
              className="px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold flex items-center gap-1 active:scale-95">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button onClick={() => setFilterRefurbished(filterRefurbished === "refurbished" ? "all" : "refurbished")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap flex items-center gap-1 ${filterRefurbished === "refurbished" ? "border-orange-400 bg-orange-50 text-orange-700" : "border-gray-200 text-gray-500 bg-white"}`}>
              <RefreshCw className="w-3 h-3" /> Refurbished
            </button>
            {["all", ...CATEGORIES].map(c => (
              <button key={c} onClick={() => setFilterCategory(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize whitespace-nowrap ${filterCategory === c ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 bg-white"}`}>
                {c}</button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16"><ShoppingBag className="w-12 h-12 text-gray-300 mb-3" /><p className="text-gray-500 text-sm">No items yet</p></div>
          ) : (
            <div className="space-y-2">
              {filtered.map(item => {
                const condObj = CONDITIONS.find(c => c.value === item.condition);
                const discountPct = item.original_price && item.price < item.original_price
                  ? Math.round((1 - item.price / item.original_price) * 100)
                  : 0;
                return (
                  <div key={item.id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 ${!item.is_active ? "opacity-60" : ""}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-gray-900 text-sm truncate">{item.name}</h3>
                          {item.is_refurbished && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">Refurbished</span>}
                          {!item.is_active && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Hidden</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full capitalize">{item.category}</span>
                          {item.brand && <span className="text-[10px] text-gray-400">{item.brand}</span>}
                          {condObj && item.is_refurbished && <span className={`text-[10px] bg-${condObj.color}-50 text-${condObj.color}-600 px-1.5 py-0.5 rounded-full`}>{condObj.label}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-base font-black text-gray-800">₹{item.price}</span>
                          {item.original_price && item.original_price > item.price && (
                            <>
                              <span className="text-xs text-gray-400 line-through">₹{item.original_price}</span>
                              <span className="text-xs font-bold text-emerald-600">{discountPct}% off</span>
                            </>
                          )}
                          <span className="text-xs text-gray-400 ml-auto">{item.stock === -1 ? "∞" : `${item.stock} left`}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button onClick={() => handleToggleItem(item)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.is_active ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
                          {item.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button onClick={() => { setEditItem(item); setShowItemModal(true); }} className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => setConfirmDelete(item)} className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>)}

        {/* ORDERS TAB */}
        {tab === "orders" && (<>
          {/* Order status filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button onClick={() => setOrderStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap ${orderStatusFilter === "all" ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 bg-white"}`}>
              All</button>
            {ORDER_STATUSES.map(s => (
              <button key={s.value} onClick={() => setOrderStatusFilter(s.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap flex items-center gap-1 ${orderStatusFilter === s.value ? `border-${s.color}-400 bg-${s.color}-50 text-${s.color}-700` : "border-gray-200 text-gray-500 bg-white"}`}>
                <s.icon className="w-3 h-3" /> {s.label}</button>
            ))}
          </div>

          {orders.length === 0 ? (
            <div className="flex flex-col items-center py-16"><ShoppingCart className="w-12 h-12 text-gray-300 mb-3" /><p className="text-gray-500 text-sm">No orders yet</p></div>
          ) : (
            <div className="space-y-2">
              {orders.map(order => {
                const statusObj = ORDER_STATUSES.find(s => s.value === order.status) || ORDER_STATUSES[0];
                return (
                  <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold text-sm text-gray-800">{order.members?.full_name || "Member"}</p>
                        <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-gray-800">₹{order.final_amount}</p>
                        {order.points_used > 0 && <p className="text-xs text-amber-600">-{order.points_used} pts (₹{order.discount_amount})</p>}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {(order.shop_order_items || []).map((item, i) => (
                        <span key={i}>{item.shop_items?.name || "Item"} ×{item.quantity}{i < (order.shop_order_items || []).length - 1 ? ", " : ""}</span>
                      ))}
                    </div>
                    {/* Status + Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full bg-${statusObj.color}-50 text-${statusObj.color}-600 flex items-center gap-1`}>
                        <statusObj.icon className="w-3 h-3" /> {statusObj.label}
                      </span>
                      <div className="flex gap-1">
                        {order.status === "pending" && (
                          <>
                            <button onClick={() => handleUpdateOrderStatus(order.id, "confirmed")}
                              className="px-2 py-1 text-[10px] font-medium bg-blue-50 text-blue-600 rounded-lg">Confirm</button>
                            <button onClick={() => handleUpdateOrderStatus(order.id, "cancelled")}
                              className="px-2 py-1 text-[10px] font-medium bg-red-50 text-red-600 rounded-lg">Cancel</button>
                          </>
                        )}
                        {order.status === "confirmed" && (
                          <button onClick={() => handleUpdateOrderStatus(order.id, "delivered")}
                            className="px-2 py-1 text-[10px] font-medium bg-emerald-50 text-emerald-600 rounded-lg">Mark Delivered</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>)}

        {/* ANALYTICS TAB */}
        {tab === "analytics" && <AnalyticsPanel analytics={analytics} />}

        <div className="h-4"></div>
      </main>

      <ItemModal open={showItemModal} onClose={() => { setShowItemModal(false); setEditItem(null); }} onSave={handleSaveItem} editItem={editItem} gymId={gymId} />
      <ReferralSettingsModal open={showSettings} onClose={() => setShowSettings(false)} settings={settings} onSave={handleSaveSettings} />

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-2">Delete Item</h3>
            <p className="text-sm text-gray-600 mb-4">Delete &quot;{confirmDelete.name}&quot;? This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={() => handleDeleteItem(confirmDelete.id)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
