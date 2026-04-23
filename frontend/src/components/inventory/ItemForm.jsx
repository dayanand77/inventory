import { useMemo, useState } from "react";

const INITIAL_STATE = {
  itemCode: "",
  name: "",
  category: "Laboratory Equipment",
  location: "",
  quantity: 1,
  minimumThreshold: 10,
  unit: "unit",
  description: "",
  manufacturer: "",
  supplierId: "",
  expiryDate: "",
  barcode: "",
};

function ItemForm({ initialItem, onSubmit, loading, suppliers = [] }) {
  const [form, setForm] = useState(() => {
    if (!initialItem) {
      return INITIAL_STATE;
    }

    return {
      itemCode: initialItem.itemCode,
      name: initialItem.name,
      category: initialItem.category,
      location: initialItem.location,
      quantity: initialItem.totalQuantity,
      minimumThreshold: initialItem.minimumThreshold,
      unit: initialItem.unit || "unit",
      description: initialItem.description || "",
      manufacturer: initialItem.manufacturer || "",
      supplierId: initialItem.supplierId || "",
      expiryDate: initialItem.expiryDate || "",
      barcode: initialItem.barcode || initialItem.itemCode,
    };
  });

  const title = useMemo(() => (initialItem ? "Update Item" : "Add New Item"), [initialItem]);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit(form);
  };

  return (
    <form className="inventory-form" onSubmit={handleSubmit}>
      <h3>{title}</h3>

      <label>
        Item Code
        <input
          value={form.itemCode}
          onChange={(event) => updateField("itemCode", event.target.value.toUpperCase())}
          required
          disabled={Boolean(initialItem)}
        />
      </label>

      <label>
        Item Name
        <input value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
      </label>

      <label>
        Category
        <select value={form.category} onChange={(event) => updateField("category", event.target.value)}>
          <option>Laboratory Equipment</option>
          <option>Medical Supply</option>
          <option>Pharmaceutical</option>
          <option>General Consumable</option>
        </select>
      </label>

      <label>
        Location
        <input value={form.location} onChange={(event) => updateField("location", event.target.value)} required />
      </label>

      <label>
        Total Quantity
        <input
          type="number"
          min="1"
          value={form.quantity}
          onChange={(event) => updateField("quantity", event.target.value)}
          required
        />
      </label>

      <label>
        Low Stock Threshold
        <input
          type="number"
          min="0"
          value={form.minimumThreshold}
          onChange={(event) => updateField("minimumThreshold", event.target.value)}
          required
        />
      </label>

      <label>
        Unit
        <input value={form.unit} onChange={(event) => updateField("unit", event.target.value)} />
      </label>

      <label>
        Manufacturer
        <input
          value={form.manufacturer}
          onChange={(event) => updateField("manufacturer", event.target.value)}
        />
      </label>

      <label>
        Expiration Date
        <input
          type="date"
          value={form.expiryDate}
          onChange={(event) => updateField("expiryDate", event.target.value)}
        />
      </label>

      <label>
        Supplier
        <select value={form.supplierId} onChange={(event) => updateField("supplierId", event.target.value)}>
          <option value="">-- No Supplier --</option>
          {suppliers.map(s => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
      </label>

      <label>
        Barcode / QR Value
        <input value={form.barcode} onChange={(event) => updateField("barcode", event.target.value)} />
      </label>

      <label>
        Description
        <textarea
          rows="3"
          value={form.description}
          onChange={(event) => updateField("description", event.target.value)}
        />
      </label>

      <button type="submit" className="primary-button" disabled={loading}>
        {loading ? "Saving..." : initialItem ? "Update Item" : "Create Item"}
      </button>
    </form>
  );
}

export default ItemForm;
