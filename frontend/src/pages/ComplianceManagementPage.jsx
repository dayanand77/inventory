import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { complianceService } from '../services/medicalService';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import '../styles/medicalPages.css';

export default function ComplianceManagementPage() {
  const [standards, setStandards] = useState([]);
  const [summary, setSummary] = useState(null);
  const [reports, setReports] = useState({});
  const [nonCompliant, setNonCompliant] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  const [complianceForm, setComplianceForm] = useState({
    itemId: '',
    standards: [],
    details: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stdRes, sumRes, nonCompRes, auditRes] = await Promise.all([
        complianceService.getStandards(),
        complianceService.getSummary(),
        complianceService.getNonCompliant(),
        complianceService.getAuditLog(),
      ]);

      setStandards(stdRes.data.standards || []);
      setSummary(sumRes.data);
      setNonCompliant(nonCompRes.data.items || []);
      setAuditLog(auditRes.data.logs || []);

      // Load individual standard reports
      const reportData = {};
      for (const standard of stdRes.data.standards || []) {
        try {
          const reportRes = await complianceService.getReport(standard);
          reportData[standard] = reportRes.data.items || [];
        } catch {
          reportData[standard] = [];
        }
      }
      setReports(reportData);
    } catch (err) {
      toast.error('Failed to load compliance data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompliance = async () => {
    if (!complianceForm.itemId || complianceForm.standards.length === 0) {
      toast.error('Please select item and at least one standard');
      return;
    }

    try {
      await complianceService.addItemCompliance(
        complianceForm.itemId,
        complianceForm.standards,
        complianceForm.details
      );
      toast.success('Compliance record added successfully');
      setComplianceForm({ itemId: '', standards: [], details: '' });
      setShowAddModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add compliance');
    }
  };

  const handleToggleStandard = (standard) => {
    setComplianceForm((prev) => ({
      ...prev,
      standards: prev.standards.includes(standard)
        ? prev.standards.filter((s) => s !== standard)
        : [...prev.standards, standard],
    }));
  };

  if (loading) return <Loader />;

  return (
    <div className="page-container">
      <h1>Compliance Management</h1>

      {/* Summary Cards */}
      {summary && (
        <div className="alerts-summary">
          <div className="alert-card">
            <h3>Total Items</h3>
            <p className="count">{summary.totalItems}</p>
          </div>
          <div className="alert-card">
            <h3>Compliant Items</h3>
            <p className="count">{summary.compliantItems}</p>
          </div>
          <div className="alert-card">
            <h3>Compliance Rate</h3>
            <p className="count">{summary.compliancePercentage}%</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
        <button
          className={`tab-btn ${activeTab === 'standards' ? 'active' : ''}`}
          onClick={() => setActiveTab('standards')}
        >
          By Standard
        </button>
        <button
          className={`tab-btn ${activeTab === 'non-compliant' ? 'active' : ''}`}
          onClick={() => setActiveTab('non-compliant')}
        >
          Non-Compliant
        </button>
        <button
          className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          Audit Log
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'summary' && summary && (
          <div className="section">
            <div className="section-header">
              <h2>Compliance Overview</h2>
              <button
                className="btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                Add Compliance Record
              </button>
            </div>

            <div className="compliance-breakdown">
              <h3>Standards Breakdown</h3>
              {summary.standardsBreakdown && summary.standardsBreakdown.length > 0 ? (
                <div className="standards-grid">
                  {summary.standardsBreakdown.map((item) => (
                    <div key={item._id} className="standard-card">
                      <h4>{item._id}</h4>
                      <p className="count">{item.count} items</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No compliance records yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'standards' && (
          <div className="section">
            <h2>Items by Compliance Standard</h2>
            {standards.length > 0 ? (
              standards.map((standard) => (
                <div key={standard} className="standard-section">
                  <h3>{standard}</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Item Code</th>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>Manufacturer</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports[standard] && reports[standard].length > 0 ? (
                        reports[standard].map((item) => (
                          <tr key={item._id}>
                            <td>{item.itemCode}</td>
                            <td>{item.name}</td>
                            <td>{item.category}</td>
                            <td>{item.manufacturer || '-'}</td>
                            <td>
                              <span className="badge badge-success">
                                Compliant
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center">
                            No items with this standard
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ))
            ) : (
              <p className="empty-state">No standards available</p>
            )}
          </div>
        )}

        {activeTab === 'non-compliant' && (
          <div className="section">
            <h2>Non-Compliant Items</h2>
            <p className="section-info">
              Items that do not have any compliance standards assigned
            </p>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Manufacturer</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {nonCompliant.length > 0 ? (
                  nonCompliant.map((item) => (
                    <tr key={item._id}>
                      <td>{item.itemCode}</td>
                      <td>{item.name}</td>
                      <td>{item.category}</td>
                      <td>{item.manufacturer || '-'}</td>
                      <td>
                        <button
                          className="btn-small btn-primary"
                          onClick={() => {
                            setComplianceForm({
                              itemId: item._id,
                              standards: [],
                              details: '',
                            });
                            setShowAddModal(true);
                          }}
                        >
                          Add Compliance
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">
                      All items are compliant!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="section">
            <h2>Compliance Audit Log</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Standards</th>
                  <th>Details</th>
                  <th>Recorded By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.length > 0 ? (
                  auditLog.map((log) => (
                    <tr key={log._id}>
                      <td>{log.itemCode}</td>
                      <td>{log.standards.join(', ')}</td>
                      <td>{log.details || '-'}</td>
                      <td>{log.recordedBy || '-'}</td>
                      <td>{new Date(log.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">
                      No audit records
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Compliance Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Compliance Record"
      >
        <div className="form-group">
          <label>Item ID *</label>
          <input
            type="text"
            value={complianceForm.itemId}
            onChange={(e) =>
              setComplianceForm({
                ...complianceForm,
                itemId: e.target.value,
              })
            }
            placeholder="Enter item ID"
          />
        </div>

        <div className="form-group">
          <label>Compliance Standards *</label>
          <div className="checkboxes">
            {standards.map((standard) => (
              <label key={standard} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={complianceForm.standards.includes(standard)}
                  onChange={() => handleToggleStandard(standard)}
                />
                {standard}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Details</label>
          <textarea
            value={complianceForm.details}
            onChange={(e) =>
              setComplianceForm({
                ...complianceForm,
                details: e.target.value,
              })
            }
            placeholder="Enter compliance details"
          />
        </div>

        <div className="modal-actions">
          <button className="btn-primary" onClick={handleAddCompliance}>
            Add Compliance
          </button>
          <button
            className="btn-secondary"
            onClick={() => setShowAddModal(false)}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
