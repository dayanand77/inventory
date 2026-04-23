import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import Modal from "../components/common/Modal";
import { useAuth } from "../context/AuthContext";
import {
  createSupplier,
  deleteSupplier,
  fetchSuppliers,
  updateSupplier,
} from "../services/supplierService";

function SupplierForm({ initialItem, onSubmit, loading }) {
  const [formValues, setFormValues] = useState({
    name: initialItem?.name || "",
    contactName: initialItem?.contactName || "",
    contactEmail: initialItem?.contactEmail || "",
    contactPhone: initialItem?.contactPhone || "",
    address: initialItem?.address || "",
    notes: initialItem?.notes || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((curr) => ({ ...curr, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formValues);
  };

  return (
    <form onSubmit={handleSubmit} className="modal-form">
      <div className="form-group">
        <label>Company Name *</label>
        <input name="name" value={formValues.name} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label>Contact Person</label>
        <input name="contactName" value={formValues.contactName} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Contact Email</label>
        <input type="email" name="contactEmail" value={formValues.contactEmail} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Contact Phone</label>
        <input name="contactPhone" value={formValues.contactPhone} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Address</label>
        <input name="address" value={formValues.address} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Notes</label>
        <textarea name="notes" value={formValues.notes} onChange={handleChange} rows={3} />
      </div>

      <div className="modal-actions">
        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? "Saving..." : "Save Supplier"}
        </button>
      </div>
    </form>
  );
}

function SupplierTable({ items, canManage, onEdit, onDelete }) {
  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            <th>Company Name</th>
            <th>Contact Person</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Items Supplied</th>
            {canManage && <th className="actions-col">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td>{item.name}</td>
              <td>{item.contactName || "-"}</td>
              <td>{item.contactEmail || "-"}</td>
              <td>{item.contactPhone || "-"}</td>
              <td>
                <button 
                  type="button" 
                  className="ghost-button" 
                  style={{ padding: "4px 8px", fontSize: "0.8rem" }}
                  onClick={() => window.dispatchEvent(new CustomEvent("view-supplier-items", { detail: item }))}
                >
                  View {item.suppliedItems?.length || 0} items
                </button>
              </td>
              {canManage && (
                <td className="actions-col">
                  <button type="button" onClick={() => onEdit(item)}>Edit</button>
                  <button type="button" className="danger-text" onClick={() => onDelete(item)}>Delete</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SuppliersPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItems, setViewingItems] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const handleViewItems = (e) => setViewingItems(e.detail);
    window.addEventListener("view-supplier-items", handleViewItems);
    return () => window.removeEventListener("view-supplier-items", handleViewItems);
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const result = await fetchSuppliers();
      setItems(result);
    } catch {
      toast.error("Unable to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const filteredItems = useMemo(() => {
    const s = search.trim().toLowerCase();
    return items.filter((item) => {
      return !s || 
             item.name.toLowerCase().includes(s) || 
             (item.contactName && item.contactName.toLowerCase().includes(s)) ||
             (item.contactEmail && item.contactEmail.toLowerCase().includes(s));
    });
  }, [items, search]);

  const resetModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleFormSubmit = async (formValues) => {
    setSaving(true);
    try {
      if (editingItem) {
        await updateSupplier(editingItem._id, formValues);
        toast.success("Supplier updated");
      } else {
        await createSupplier(formValues);
        toast.success("Supplier created");
      }
      resetModal();
      await loadSuppliers();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to save supplier");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Delete supplier ${item.name}?`);
    if (!confirmed) return;

    try {
      await deleteSupplier(item._id);
      toast.success("Supplier deleted");
      await loadSuppliers();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to delete supplier");
    }
  };

  if (loading) {
    return <Loader message="Loading suppliers..." />;
  }

  return (
    <div className="page-stack">
      <section className="page-header-row">
        <div>
          <h1>Suppliers</h1>
          <p>Manage vendors and contacts for medical inventory.</p>
        </div>
        <div className="button-row">
          {isAdmin && (
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                setEditingItem(null);
                setModalOpen(true);
              }}
            >
              Add Supplier
            </button>
          )}
        </div>
      </section>

      <section className="panel-card">
        <div className="filter-grid" style={{ gridTemplateColumns: '1fr' }}>
          <input
            placeholder="Search by name, contact, email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      <section className="panel-card">
        {!filteredItems.length ? (
          <EmptyState title="No matching suppliers" subtitle="Try adjusting your search criteria." />
        ) : (
          <SupplierTable
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
        title={editingItem ? "Update Supplier" : "Create Supplier"}
        open={modalOpen}
        onClose={resetModal}
      >
        <SupplierForm initialItem={editingItem} onSubmit={handleFormSubmit} loading={saving} />
      </Modal>

      <Modal
        title={`Items supplied by ${viewingItems?.name}`}
        open={!!viewingItems}
        onClose={() => setViewingItems(null)}
      >
        {viewingItems?.suppliedItems?.length > 0 ? (
          <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Available Qty</th>
                  <th>Total Qty</th>
                </tr>
              </thead>
              <tbody>
                {viewingItems.suppliedItems.map(i => (
                  <tr key={i._id}>
                    <td>{i.itemCode}</td>
                    <td>{i.name}</td>
                    <td>{i.category}</td>
                    <td>{i.availableQuantity}</td>
                    <td>{i.totalQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No items are currently linked to this supplier.</p>
        )}
      </Modal>
    </div>
  );
}

export default SuppliersPage;
