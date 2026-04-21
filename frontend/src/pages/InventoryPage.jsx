import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import Modal from "../components/common/Modal";
import BarcodeScanner from "../components/inventory/BarcodeScanner";
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

function InventoryPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filters, setFilters] = useState({ search: "", category: "", lowStock: false });

  const loadInventory = async () => {
    setLoading(true);
    try {
      const result = await fetchInventory(filters);
      setItems(result);
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
        <ItemForm initialItem={editingItem} onSubmit={handleFormSubmit} loading={saving} />
      </Modal>
    </div>
  );
}

export default InventoryPage;
