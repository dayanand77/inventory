import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import Modal from "../components/common/Modal";
import BarcodeScanner from "../components/inventory/BarcodeScanner";
import BarcodeModalScanner from "../components/common/BarcodeScanner";
import InventoryTable from "../components/inventory/InventoryTable";
import ItemForm from "../components/inventory/ItemForm";
import { useAuth } from "../context/AuthContext";
import {
  createInventoryItem,
  deleteInventoryItem,
  downloadInventoryCsv,
  downloadInventoryPdf,
  fetchInventory,
  fetchItemByCode,
  updateInventoryItem,
} from "../services/inventoryService";
import { fetchSuppliers } from "../services/supplierService";
import { restockItem } from "../services/transactionService";

function InventoryPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [selectedRestockItemId, setSelectedRestockItemId] = useState("");
  const [restockQty, setRestockQty] = useState(1);
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [filters, setFilters] = useState({ search: "", category: "", lowStock: false });

  const loadInventory = async () => {
    setLoading(true);
    try {
      const [inventoryResult, suppliersResult] = await Promise.all([
        fetchInventory(filters),
        fetchSuppliers()
      ]);
      setItems(inventoryResult);
      setSuppliers(suppliersResult);
    } catch {
      toast.error("Unable to load inventory items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [filters.lowStock]);

  const filteredItems = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const category = filters.category;

    return items.filter((item) => {
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search) ||
        item.itemCode.toLowerCase().includes(search) ||
        item.location.toLowerCase().includes(search);

      const matchesCategory = !category || item.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [items, filters.search, filters.category]);

  const resetModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleFormSubmit = async (formValues) => {
    setSaving(true);
    try {
      if (editingItem) {
        await updateInventoryItem(editingItem._id, {
          ...formValues,
          totalQuantity: Number(formValues.quantity),
        });
        toast.success("Item updated");
      } else {
        await createInventoryItem({
          ...formValues,
          quantity: Number(formValues.quantity),
          minimumThreshold: Number(formValues.minimumThreshold),
        });
        toast.success("Item created");
      }

      resetModal();
      await loadInventory();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRestockItemId) return;
    setSaving(true);
    try {
      await restockItem({ itemId: selectedRestockItemId, quantity: restockQty, notes: "Manual restock via inventory page" });
      toast.success(`Stock added successfully`);
      setRestockModalOpen(false);
      setSelectedRestockItemId("");
      setRestockQty(1);
      await loadInventory();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to restock item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete item ${item.name}?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteInventoryItem(item._id);
      toast.success("Item deleted");
      await loadInventory();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to delete item");
    }
  };

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleScanDetected = async (value) => {
    try {
      const item = await fetchItemByCode(value);
      toast.success(`Found item: ${item.name}`);
      setFilters((current) => ({ ...current, search: item.itemCode }));
    } catch {
      toast.error("No item found for scanned code");
    }
  };

  const handleModalScan = async (barcode) => {
    setScannerModalOpen(false);
    await handleScanDetected(barcode);
  };

  if (loading) {
    return <Loader message="Loading inventory..." />;
  }

  return (
    <div className="page-stack">
      <section className="page-header-row">
        <div>
          <h1>Inventory</h1>
          <p>Manage laboratory equipment, medical supplies, and stock availability.</p>
        </div>
        <div className="button-row">
          {isAdmin && (
            <>
              <button
                type="button"
                className="outline-button"
                onClick={async () => triggerDownload(await downloadInventoryCsv(), "inventory-report.csv")}
              >
                Export CSV
              </button>
              <button
                type="button"
                className="outline-button"
                onClick={async () => triggerDownload(await downloadInventoryPdf(), "inventory-report.pdf")}
              >
                Export PDF
              </button>
              <button
                type="button"
                className="outline-button"
                style={{ borderColor: 'var(--success-color)', color: 'var(--success-color)' }}
                onClick={() => {
                  setSelectedRestockItemId("");
                  setRestockQty(1);
                  setRestockModalOpen(true);
                }}
              >
                Restock Item
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setEditingItem(null);
                  setModalOpen(true);
                }}
              >
                Add Item
              </button>
            </>
          )}
        </div>
      </section>

      <section className="panel-card">
        <div className="filter-grid">
          <input
            placeholder="Search by name, code, location"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          />
          <select
            value={filters.category}
            onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
          >
            <option value="">All Categories</option>
            <option value="Laboratory Equipment">Laboratory Equipment</option>
            <option value="Medical Supply">Medical Supply</option>
            <option value="Pharmaceutical">Pharmaceutical</option>
            <option value="General Consumable">General Consumable</option>
          </select>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={filters.lowStock}
              onChange={(event) => setFilters((current) => ({ ...current, lowStock: event.target.checked }))}
            />
            Show only low stock
          </label>
          <button type="button" className="outline-button" onClick={loadInventory}>
            Apply Filters
          </button>
        </div>
      </section>

      <section className="panel-grid">
        <article className="panel-card">
          <h3>Barcode / QR Lookup</h3>
          <p>Use your camera to scan item code and jump to matching inventory records.</p>
          <BarcodeScanner onDetected={handleScanDetected} />
          <button 
            type="button" 
            className="outline-button"
            onClick={() => setScannerModalOpen(true)}
            style={{ marginTop: "10px", width: "100%" }}
          >
            📱 Open Scanner in Fullscreen
          </button>
        </article>
        <article className="panel-card">
          <h3>Quick Summary</h3>
          <div className="list-panel">
            <div className="list-row">
              <span>Total Records</span>
              <strong>{items.length}</strong>
            </div>
            <div className="list-row">
              <span>Low Stock</span>
              <strong>{items.filter((item) => item.isLowStock).length}</strong>
            </div>
            <div className="list-row">
              <span>Total Available Units</span>
              <strong>{items.reduce((sum, item) => sum + (item.availableQuantity || 0), 0)}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="panel-card">
        {!filteredItems.length ? (
          <EmptyState title="No matching records" subtitle="Try another search or filter combination." />
        ) : (
          <InventoryTable
            items={filteredItems}
            canManage={isAdmin}
            onEdit={(item) => {
              setEditingItem(item);
              setModalOpen(true);
            }}
            onDelete={handleDelete}
          />
        )}
      </section>

      <Modal
        title={editingItem ? "Update Inventory Item" : "Create Inventory Item"}
        open={modalOpen}
        onClose={resetModal}
      >
        <ItemForm initialItem={editingItem} onSubmit={handleFormSubmit} loading={saving} suppliers={suppliers} />
      </Modal>

      {isAdmin && (
        <Modal title="Restock Inventory Item" open={restockModalOpen} onClose={() => setRestockModalOpen(false)}>
          <form onSubmit={handleRestockSubmit} className="form-grid">
            <label>
              Select Item (Name or Code)
              <select
                value={selectedRestockItemId}
                onChange={(e) => setSelectedRestockItemId(e.target.value)}
                required
              >
                <option value="">-- Select an item to restock --</option>
                {items.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name} ({item.itemCode})
                  </option>
                ))}
              </select>
            </label>

            {selectedRestockItemId && (
              <div style={{ padding: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", fontSize: "0.9rem" }}>
                {(() => {
                  const sel = items.find(i => i._id === selectedRestockItemId);
                  const supplier = suppliers.find(s => s._id === sel?.supplierId);
                  return (
                    <>
                      <p style={{ margin: "4px 0" }}><strong>Category:</strong> {sel?.category || "N/A"}</p>
                      <p style={{ margin: "4px 0" }}><strong>Current Stock:</strong> {sel?.availableQuantity} available ({sel?.totalQuantity} total)</p>
                      <p style={{ margin: "4px 0" }}><strong>Supplier:</strong> {supplier?.name || "No assigned supplier"}</p>
                    </>
                  );
                })()}
              </div>
            )}

            <label>
              Quantity to Add
              <input type="number" min="1" value={restockQty} onChange={(e) => setRestockQty(Number(e.target.value))} required />
            </label>

            <div className="button-row" style={{ marginTop: "1rem" }}>
              <button type="submit" className="primary-button" disabled={saving || !selectedRestockItemId}>
                Confirm Restock
              </button>
            </div>
          </form>
        </Modal>
      )}

      <Modal title="Fullscreen Barcode Scanner" open={scannerModalOpen} onClose={() => setScannerModalOpen(false)}>
        <BarcodeModalScanner onScan={handleModalScan} onClose={() => setScannerModalOpen(false)} />
      </Modal>
    </div>
  );
}

export default InventoryPage;
