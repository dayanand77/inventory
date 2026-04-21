import EmptyState from "../common/EmptyState";

function InventoryTable({ items, onEdit, onDelete, canManage = false }) {
  if (!items.length) {
    return (
      <EmptyState
        title="No inventory items found"
        subtitle="Try adjusting filters or add a new item to get started."
      />
    );
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Item Name</th>
            <th>Category</th>
            <th>Location</th>
            <th>Available</th>
            <th>Issued</th>
            <th>Total</th>
            <th>Status</th>
            {canManage && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id}>
              <td>{item.itemCode}</td>
              <td>{item.name}</td>
              <td>{item.category}</td>
              <td>{item.location}</td>
              <td>{item.availableQuantity}</td>
              <td>{item.issuedQuantity}</td>
              <td>{item.totalQuantity}</td>
              <td>
                <span className={item.isLowStock ? "pill danger" : "pill success"}>
                  {item.isLowStock ? "Low" : "Healthy"}
                </span>
              </td>
              {canManage && (
                <td>
                  <div className="button-row">
                    <button type="button" className="ghost-button" onClick={() => onEdit(item)}>
                      Edit
                    </button>
                    <button type="button" className="danger-button" onClick={() => onDelete(item)}>
                      Delete
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InventoryTable;
