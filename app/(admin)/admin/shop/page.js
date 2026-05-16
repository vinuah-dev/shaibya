"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/layout/Header";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  ShoppingBag, Plus, X, Edit3, Trash2, Package, DollarSign,
  Tag, Archive, Eye, EyeOff, Settings, Gift, Users, Star,
  ChevronDown, ChevronUp, AlertTriangle, Search, Hash,
  Percent, TrendingUp, ShoppingCart,
} from "lucide-react";

// ─── Add/Edit Item Modal ─────────────────────────────────────
function ItemModal({ open, onClose, onSave, editItem }) {
  const [name, setName] = useState(editItem?.name || "");
  const [description, setDescription] = useState(editItem?.description || "");
  const [price, setPrice] = useState(editItem?.price || "");
  const [category, setCategory] = useState(editItem?.category || "general");
  const [stock, setStock] = useState(editItem?.stock === -1 ? "" : editItem?.stock || "");
  const [unlimited, setUnlimited] = useState(editItem?.stock === -1 || !editItem);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(editItem?.name || ""); setDescription(editItem?.description || "");
    setPrice(editItem?.price || ""); setCategory(editItem?.category || "general");
    setStock(editItem?.stock === -1 ? "" : editItem?.stock || "");
    setUnlimited(editItem?.stock === -1 || !editItem);
  }, [editItem]);

  if (!open) return null;

  const handleSave = async () => {
    if (!name.trim() || !price) return;
    setSaving(true);
    await onSave({
      name: name.trim(), description: description.trim(),
      price: parseFloat(price), category: category.trim(),
      stock: unlimited ? -1 : parseInt(stock) || 0,
      ...(editItem ? { item_id: editItem.id } : {}),
    });
    setSaving(false); onClose();
  };

  const CATEGORIES = ["general", "supplements", "apparel", "equipment", "beverages", "snacks", "accessories"];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">{editItem ? "Edit Item" : "Add Item"}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div><label className="text-xs font-medium text-gray-500 mb-1 block">Item Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Protein Shake"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>

          <div><label className="text-xs font-medium text-gray-500 mb-1 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Optional description"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" /></div>

          <div><label className="text-xs font-medium text-gray-500 mb-1 block">Price (₹) *</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-5 max-w-sm w-full">
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

// ─── Main Page ───────────────────────────────────────────────
export default function AdminShopPage() {
  const { user, selectedGym, isReady } = useAuthContext();
  const { showToast } = useToast();
  const [tab, setTab] = useState("items"); // items | orders
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

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
    const json = await apiCall("/api/shop", { action: "all_orders", limit: 50 });
    setOrders(json.data || []);
  }, [apiCall]);

  const fetchSettings = useCallback(async () => {
    const json = await apiCall("/api/referral", { action: "get_settings" });
    setSettings(json.data);
  }, [apiCall]);

  useEffect(() => {
    if (gymId && isReady) {
      Promise.all([fetchItems(), fetchSettings()]).then(() => setLoading(false));
    } else if (isReady) setLoading(false);
  }, [gymId, isReady, fetchItems, fetchSettings]);

  useEffect(() => { if (tab === "orders" && orders.length === 0) fetchOrders(); }, [tab, orders.length, fetchOrders]);

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

  const handleSaveSettings = async (data) => {
    const json = await apiCall("/api/referral", { action: "update_settings", ...data });
    if (json.success) { showToast("Settings saved", "success"); fetchSettings(); }
    else showToast(json.error || "Failed", "error");
  };

  const filtered = items.filter(i => !searchQuery || i.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return (<div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100"><Header title="Shop" /><div className="flex items-center justify-center py-20"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div></div>);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 mb-17 safe-area-inset-bottom">
      <Header title="Shop Management" />
      <main className="px-3 py-2 space-y-3">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white rounded-xl shadow-sm border border-gray-100">
          {[{ key: "items", label: "Items", icon: <Package className="w-4 h-4" /> }, { key: "orders", label: "Orders", icon: <ShoppingCart className="w-4 h-4" /> }].map(t => (
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

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16"><ShoppingBag className="w-12 h-12 text-gray-300 mb-3" /><p className="text-gray-500 text-sm">No items yet</p></div>
          ) : (
            <div className="space-y-2">
              {filtered.map(item => (
                <div key={item.id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 ${!item.is_active ? "opacity-60" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-sm truncate">{item.name}</h3>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">{item.category}</span>
                        {!item.is_active && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Hidden</span>}
                      </div>
                      {item.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-base font-black text-gray-800">₹{item.price}</span>
                        <span className="text-xs text-gray-400">{item.stock === -1 ? "Unlimited stock" : `${item.stock} in stock`}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => handleToggleItem(item)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.is_active ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
                        {item.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button onClick={() => { setEditItem(item); setShowItemModal(true); }} className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => setConfirmDelete(item)} className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>)}

        {/* ORDERS TAB */}
        {tab === "orders" && (<>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center py-16"><ShoppingCart className="w-12 h-12 text-gray-300 mb-3" /><p className="text-gray-500 text-sm">No orders yet</p></div>
          ) : (
            <div className="space-y-2">
              {orders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-bold text-sm text-gray-800">{order.members?.full_name || "Member"}</p>
                      <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-gray-800">₹{order.total}</p>
                      {order.points_used > 0 && <p className="text-xs text-amber-600">-{order.points_used} pts (₹{order.points_discount})</p>}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {(order.items || []).map((item, i) => <span key={i}>{item.name} ×{item.qty}{i < order.items.length - 1 ? ", " : ""}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>)}

        <div className="h-4"></div>
      </main>

      <ItemModal open={showItemModal} onClose={() => { setShowItemModal(false); setEditItem(null); }} onSave={handleSaveItem} editItem={editItem} />
      <ReferralSettingsModal open={showSettings} onClose={() => setShowSettings(false)} settings={settings} onSave={handleSaveSettings} />

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-2">Delete Item</h3>
            <p className="text-sm text-gray-600 mb-4">Delete "{confirmDelete.name}"? This cannot be undone.</p>
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
