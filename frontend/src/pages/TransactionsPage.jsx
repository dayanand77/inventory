import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import Loader from "../components/common/Loader";
import { useAuth } from "../context/AuthContext";
import { fetchInventory } from "../services/inventoryService";
import {
  approveRequest,
  fetchTransactions,
  issueItem,
  requestItem,
  returnItem,
} from "../services/transactionService";
import { formatDate } from "../utils/formatters";

function TransactionsPage() {
  const { profile, isAdmin } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    itemId: "",
    quantity: 1,
    recipientName: "",
    department: profile?.department || "",
    notes: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [items, transactionsData] = await Promise.all([
        fetchInventory(),
        fetchTransactions(),
      ]);
      setInventory(items);
      setTransactions(transactionsData);
      if (!form.itemId && items[0]?._id) {
        setForm((current) => ({ ...current, itemId: items[0]._id }));
      }
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingRequests = useMemo(
    () => transactions.filter((tx) => tx.type === "REQUEST" && tx.status === "PENDING"),
    [transactions]
  );

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const runAction = async (action) => {
    setBusy(true);
    try {
      await action();
      await loadData();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  const actionPayload = {
    itemId: form.itemId,
    quantity: Number(form.quantity),
    recipientName: form.recipientName,
    department: form.department,
    notes: form.notes,
  };

  if (loading) {
    return <Loader message="Loading transaction module..." />;
  }

  return (
    <div className="page-stack">
      <section className="page-header-row">
        <div>
          <h1>Transactions</h1>
          <p>Issue, return, and request inventory items with full traceability.</p>
        </div>
      </section>

      <section className="panel-grid">
        <article className="panel-card">
          <h3>{isAdmin ? "Issue or Return Item" : "Request or Return Item"}</h3>

          <div className="form-grid">
            <label>
              Item
              <select value={form.itemId} onChange={(event) => updateField("itemId", event.target.value)}>
                {inventory.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name} ({item.itemCode})
                  </option>
                ))}
              </select>
            </label>

            <label>
              Quantity
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(event) => updateField("quantity", event.target.value)}
              />
            </label>

            <label>
              Recipient Name
              <input
                value={form.recipientName}
                onChange={(event) => updateField("recipientName", event.target.value)}
                placeholder="Student / lab / department"
              />
            </label>

            <label>
              Department
              <input
                value={form.department}
                onChange={(event) => updateField("department", event.target.value)}
              />
            </label>

            <label>
              Notes
              <textarea rows="3" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
            </label>
          </div>

          <div className="button-row">
            {isAdmin ? (
              <button
                type="button"
                className="primary-button"
                disabled={busy}
                onClick={() =>
                  runAction(async () => {
                    await issueItem(actionPayload);
                    toast.success("Item issued");
                  })
                }
              >
                Issue Item
              </button>
            ) : (
              <button
                type="button"
                className="primary-button"
                disabled={busy}
                onClick={() =>
                  runAction(async () => {
                    await requestItem(actionPayload);
                    toast.success("Request submitted");
                  })
                }
              >
                Submit Request
              </button>
            )}

            <button
              type="button"
              className="outline-button"
              disabled={busy}
              onClick={() =>
                runAction(async () => {
                  await returnItem(actionPayload);
                  toast.success("Item returned");
                })
              }
            >
              Return Item
            </button>
          </div>
        </article>

        {isAdmin && (
          <article className="panel-card">
            <h3>Pending Requests</h3>
            <div className="list-panel">
              {pendingRequests.map((request) => (
                <div key={request._id} className="list-row">
                  <div>
                    <strong>{request.requesterName || request.requesterUid}</strong>
                    <p>
                      Qty {request.quantity} · Item {request.itemId}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="outline-button"
                    onClick={() =>
                      runAction(async () => {
                        await approveRequest(request._id);
                        toast.success("Request approved");
                      })
                    }
                  >
                    Approve
                  </button>
                </div>
              ))}
              {!pendingRequests.length && <p>No pending requests.</p>}
            </div>
          </article>
        )}
      </section>

      <section className="panel-card">
        <h3>Transaction History</h3>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Status</th>
                <th>Quantity</th>
                <th>Requester</th>
                <th>Department</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction._id}>
                  <td>{transaction.type}</td>
                  <td>{transaction.status}</td>
                  <td>{transaction.quantity}</td>
                  <td>{transaction.requesterName || transaction.requesterUid || "-"}</td>
                  <td>{transaction.department || "-"}</td>
                  <td>{formatDate(transaction.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default TransactionsPage;
