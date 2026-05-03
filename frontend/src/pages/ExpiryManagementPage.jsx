import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { expiryService } from '../services/medicalService';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import '../styles/medicalPages.css';

export default function ExpiryManagementPage() {
  const [alerts, setAlerts] = useState(null);
  const [expiring, setExpiring] = useState([]);
  const [expired, setExpired] = useState([]);
  const [wastage, setWastage] = useState([]);
  const [wastageSummary, setWastageSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('alerts');
  const [showWastageModal, setShowWastageModal] = useState(false);
  const [days, setDays] = useState(30);
  const [wastageForm, setWastageForm] = useState({
    itemId: '',
    quantity: '',
    reason: 'Expired'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [alertsRes, expiringRes, expiredRes, wastageRes, summaryRes] =
        await Promise.all([
          expiryService.getAlerts(),
          expiryService.getExpiring(days),
          expiryService.getExpired(),
          expiryService.getWastageRecords(),
          expiryService.getWastageSummary(),
        ]);

      setAlerts(alertsRes.data);
      setExpiring(expiringRes.data.items || []);
      setExpired(expiredRes.data.items || []);
      setWastage(wastageRes.data.records || []);
      setWastageSummary(summaryRes.data.summary || []);
    } catch (err) {
      toast.error('Failed to load expiry data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordWastage = async () => {
    if (!wastageForm.itemId || !wastageForm.quantity) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await expiryService.recordWastage(
        wastageForm.itemId,
        parseInt(wastageForm.quantity),
        wastageForm.reason
      );
      toast.success('Wastage recorded successfully');
      setWastageForm({ itemId: '', quantity: '', reason: 'Expired' });
      setShowWastageModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record wastage');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="page-container">
      <h1>Expiry & Wastage Management</h1>

      {/* Alerts Summary */}
      <div className="alerts-summary">
        <div className="alert-card expired-card">
          <h3>Already Expired</h3>
          <p className="count">{alerts?.expired || 0}</p>
        </div>
        <div className="alert-card expiring-soon-card">
          <h3>Expiring in 7 Days</h3>
          <p className="count">{alerts?.expiringWithin7Days || 0}</p>
        </div>
        <div className="alert-card expiring-month-card">
          <h3>Expiring in 30 Days</h3>
          <p className="count">{alerts?.expiringWithin30Days || 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          Expiry Alerts
        </button>
        <button
          className={`tab-btn ${activeTab === 'expired' ? 'active' : ''}`}
          onClick={() => setActiveTab('expired')}
        >
          Expired Items
        </button>
        <button
          className={`tab-btn ${activeTab === 'wastage' ? 'active' : ''}`}
          onClick={() => setActiveTab('wastage')}
        >
          Wastage Records
        </button>
        <button
          className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Wastage Summary
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'alerts' && (
          <div className="section">
            <div className="section-header">
              <h2>Items Expiring Soon</h2>
              <input
                type="number"
                min="1"
                max="365"
                value={days}
                onChange={(e) => {
                  setDays(parseInt(e.target.value));
                  expiryService
                    .getExpiring(parseInt(e.target.value))
                    .then((res) => setExpiring(res.data.items || []))
                    .catch(() => toast.error('Failed to update'));
                }}
                placeholder="Days"
                className="days-input"
              />
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Expiry Date</th>
                  <th>Available Qty</th>
                  <th>Days Until Expiry</th>
                </tr>
              </thead>
              <tbody>
                {expiring.length > 0 ? (
                  expiring.map((item) => {
                    const daysLeft = Math.ceil(
                      (new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <tr key={item._id}>
                        <td>{item.itemCode}</td>
                        <td>{item.name}</td>
                        <td>{new Date(item.expiryDate).toLocaleDateString()}</td>
                        <td>{item.availableQuantity}</td>
                        <td className={daysLeft < 7 ? 'urgent' : ''}>{daysLeft}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">
                      No items expiring soon
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'expired' && (
          <div className="section">
            <h2>Expired Items</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Expiry Date</th>
                  <th>Available Qty</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {expired.length > 0 ? (
                  expired.map((item) => (
                    <tr key={item._id}>
                      <td>{item.itemCode}</td>
                      <td>{item.name}</td>
                      <td>{new Date(item.expiryDate).toLocaleDateString()}</td>
                      <td>{item.availableQuantity}</td>
                      <td>
                        <button
                          className="btn-small btn-danger"
                          onClick={() => {
                            setWastageForm({
                              itemId: item._id,
                              quantity: item.availableQuantity,
                              reason: 'Expired'
                            });
                            setShowWastageModal(true);
                          }}
                        >
                          Record Wastage
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">
                      No expired items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'wastage' && (
          <div className="section">
            <div className="section-header">
              <h2>Wastage Records</h2>
              <button
                className="btn-primary"
                onClick={() => {
                  setWastageForm({ itemId: '', quantity: '', reason: 'Other' });
                  setShowWastageModal(true);
                }}
              >
                Record Wastage
              </button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Quantity</th>
                  <th>Reason</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {wastage.length > 0 ? (
                  wastage.map((record) => (
                    <tr key={record._id}>
                      <td>{record.itemCode}</td>
                      <td>{record.itemName}</td>
                      <td>{record.quantity}</td>
                      <td>{record.reason}</td>
                      <td>{new Date(record.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">
                      No wastage records
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="section">
            <h2>Wastage Summary by Reason</h2>
            <div className="summary-cards">
              {wastageSummary.length > 0 ? (
                wastageSummary.map((item) => (
                  <div key={item._id} className="summary-card">
                    <h3>{item._id}</h3>
                    <p className="summary-total">{item.totalQuantity}</p>
                    <p className="summary-count">{item.count} records</p>
                  </div>
                ))
              ) : (
                <p className="empty-state">No wastage data available</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Wastage Modal */}
      <Modal
        open={showWastageModal}
        onClose={() => setShowWastageModal(false)}
        title="Record Wastage"
      >
        <div className="form-group">
          <label>Item ID *</label>
          <input
            type="text"
            value={wastageForm.itemId}
            onChange={(e) =>
              setWastageForm({ ...wastageForm, itemId: e.target.value })
            }
            placeholder="Enter item ID"
          />
        </div>
        <div className="form-group">
          <label>Quantity *</label>
          <input
            type="number"
            min="1"
            value={wastageForm.quantity}
            onChange={(e) =>
              setWastageForm({ ...wastageForm, quantity: e.target.value })
            }
            placeholder="Enter quantity"
          />
        </div>
        <div className="form-group">
          <label>Reason</label>
          <select
            value={wastageForm.reason}
            onChange={(e) =>
              setWastageForm({ ...wastageForm, reason: e.target.value })
            }
          >
            <option>Expired</option>
            <option>Damaged</option>
            <option>Lost</option>
            <option>Recalled</option>
            <option>Other</option>
          </select>
        </div>
        <div className="modal-actions">
          <button className="btn-primary" onClick={handleRecordWastage}>
            Record Wastage
          </button>
          <button
            className="btn-secondary"
            onClick={() => setShowWastageModal(false)}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
