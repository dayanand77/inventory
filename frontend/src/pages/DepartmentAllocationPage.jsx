import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { departmentService } from '../services/medicalService';
import Loader from '../components/common/Loader';
import Modal from '../components/common/Modal';
import '../styles/medicalPages.css';

export default function DepartmentAllocationPage() {
  const [departments, setDepartments] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [consumption, setConsumption] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [activeTab, setActiveTab] = useState('departments');

  const [deptForm, setDeptForm] = useState({
    name: '',
    description: '',
    contactInfo: '',
  });

  const [allocateForm, setAllocateForm] = useState({
    itemId: '',
    quantity: '',
  });

  const [usageForm, setUsageForm] = useState({
    allocationId: '',
    usedQuantity: '',
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const res = await departmentService.listDepartments();
      setDepartments(res.data.departments || []);
    } catch (err) {
      toast.error('Failed to load departments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async () => {
    if (!deptForm.name) {
      toast.error('Department name is required');
      return;
    }

    try {
      await departmentService.createDepartment(
        deptForm.name,
        deptForm.description,
        deptForm.contactInfo
      );
      toast.success('Department created successfully');
      setDeptForm({ name: '', description: '', contactInfo: '' });
      setShowDeptModal(false);
      loadDepartments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create department');
    }
  };

  const loadDeptAllocations = async (deptId) => {
    try {
      const res = await departmentService.getDepartmentAllocations(deptId);
      setAllocations(res.data.allocations || []);
    } catch (err) {
      toast.error('Failed to load allocations');
    }
  };

  const loadDeptConsumption = async (deptId) => {
    try {
      const res = await departmentService.getDepartmentConsumption(deptId);
      setConsumption(res.data.consumption || []);
    } catch (err) {
      toast.error('Failed to load consumption');
    }
  };

  const handleSelectDept = async (dept) => {
    setSelectedDept(dept);
    setActiveTab('allocations');
    await Promise.all([
      loadDeptAllocations(dept._id),
      loadDeptConsumption(dept._id),
    ]);
  };

  const handleAllocateItems = async () => {
    if (!allocateForm.itemId || !allocateForm.quantity) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!selectedDept) {
      toast.error('Please select a department');
      return;
    }

    try {
      await departmentService.allocateItems(
        selectedDept._id,
        allocateForm.itemId,
        parseInt(allocateForm.quantity)
      );
      toast.success('Items allocated successfully');
      setAllocateForm({ itemId: '', quantity: '' });
      setShowAllocateModal(false);
      loadDeptAllocations(selectedDept._id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to allocate items');
    }
  };

  const handleRecordUsage = async () => {
    if (!usageForm.allocationId || !usageForm.usedQuantity) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      await departmentService.recordUsage(
        usageForm.allocationId,
        parseInt(usageForm.usedQuantity)
      );
      toast.success('Usage recorded successfully');
      setUsageForm({ allocationId: '', usedQuantity: '' });
      setShowUsageModal(false);
      if (selectedDept) {
        await Promise.all([
          loadDeptAllocations(selectedDept._id),
          loadDeptConsumption(selectedDept._id),
        ]);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record usage');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="page-container">
      <h1>Department Allocation Management</h1>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'departments' ? 'active' : ''}`}
          onClick={() => setActiveTab('departments')}
        >
          Departments
        </button>
        {selectedDept && (
          <>
            <button
              className={`tab-btn ${activeTab === 'allocations' ? 'active' : ''}`}
              onClick={() => setActiveTab('allocations')}
            >
              Allocations - {selectedDept.name}
            </button>
            <button
              className={`tab-btn ${activeTab === 'consumption' ? 'active' : ''}`}
              onClick={() => setActiveTab('consumption')}
            >
              Consumption - {selectedDept.name}
            </button>
          </>
        )}
      </div>

      <div className="tab-content">
        {activeTab === 'departments' && (
          <div className="section">
            <div className="section-header">
              <h2>Departments</h2>
              <button
                className="btn-primary"
                onClick={() => setShowDeptModal(true)}
              >
                Create Department
              </button>
            </div>
            <div className="departments-grid">
              {departments.length > 0 ? (
                departments.map((dept) => (
                  <div key={dept._id} className="dept-card">
                    <h3>{dept.name}</h3>
                    {dept.description && <p>{dept.description}</p>}
                    {dept.contact_info && (
                      <p className="contact">📞 {dept.contact_info}</p>
                    )}
                    <button
                      className="btn-primary"
                      onClick={() => handleSelectDept(dept)}
                    >
                      View Allocations
                    </button>
                  </div>
                ))
              ) : (
                <p className="empty-state">No departments created yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'allocations' && selectedDept && (
          <div className="section">
            <div className="section-header">
              <h2>Allocations for {selectedDept.name}</h2>
              <button
                className="btn-primary"
                onClick={() => setShowAllocateModal(true)}
              >
                Allocate Items
              </button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Allocated Qty</th>
                  <th>Used Qty</th>
                  <th>Remaining</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {allocations.length > 0 ? (
                  allocations.map((alloc) => {
                    const remaining =
                      alloc.allocatedQuantity - alloc.usedQuantity;
                    return (
                      <tr key={alloc._id}>
                        <td>{alloc.itemCode}</td>
                        <td>{alloc.itemName}</td>
                        <td>{alloc.allocatedQuantity}</td>
                        <td>{alloc.usedQuantity}</td>
                        <td>{remaining}</td>
                        <td>{alloc.status}</td>
                        <td>
                          <button
                            className="btn-small btn-primary"
                            onClick={() => {
                              setUsageForm({
                                allocationId: alloc._id,
                                usedQuantity: '',
                              });
                              setShowUsageModal(true);
                            }}
                          >
                            Record Usage
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center">
                      No allocations for this department
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'consumption' && selectedDept && (
          <div className="section">
            <h2>Consumption History - {selectedDept.name}</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Quantity Used</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {consumption.length > 0 ? (
                  consumption.map((record) => (
                    <tr key={record._id}>
                      <td>{record.itemCode}</td>
                      <td>{record.usedQuantity}</td>
                      <td>{new Date(record.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center">
                      No consumption records
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Department Modal */}
      <Modal
        isOpen={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        title="Create Department"
      >
        <div className="form-group">
          <label>Department Name *</label>
          <input
            type="text"
            value={deptForm.name}
            onChange={(e) =>
              setDeptForm({ ...deptForm, name: e.target.value })
            }
            placeholder="Enter department name"
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={deptForm.description}
            onChange={(e) =>
              setDeptForm({ ...deptForm, description: e.target.value })
            }
            placeholder="Enter description"
          />
        </div>
        <div className="form-group">
          <label>Contact Info</label>
          <input
            type="text"
            value={deptForm.contactInfo}
            onChange={(e) =>
              setDeptForm({ ...deptForm, contactInfo: e.target.value })
            }
            placeholder="Enter contact information"
          />
        </div>
        <div className="modal-actions">
          <button className="btn-primary" onClick={handleCreateDepartment}>
            Create
          </button>
          <button
            className="btn-secondary"
            onClick={() => setShowDeptModal(false)}
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* Allocate Items Modal */}
      <Modal
        isOpen={showAllocateModal}
        onClose={() => setShowAllocateModal(false)}
        title="Allocate Items to Department"
      >
        <div className="form-group">
          <label>Item ID *</label>
          <input
            type="text"
            value={allocateForm.itemId}
            onChange={(e) =>
              setAllocateForm({ ...allocateForm, itemId: e.target.value })
            }
            placeholder="Enter item ID"
          />
        </div>
        <div className="form-group">
          <label>Quantity *</label>
          <input
            type="number"
            min="1"
            value={allocateForm.quantity}
            onChange={(e) =>
              setAllocateForm({ ...allocateForm, quantity: e.target.value })
            }
            placeholder="Enter quantity"
          />
        </div>
        <div className="modal-actions">
          <button className="btn-primary" onClick={handleAllocateItems}>
            Allocate
          </button>
          <button
            className="btn-secondary"
            onClick={() => setShowAllocateModal(false)}
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* Record Usage Modal */}
      <Modal
        isOpen={showUsageModal}
        onClose={() => setShowUsageModal(false)}
        title="Record Item Usage"
      >
        <div className="form-group">
          <label>Used Quantity *</label>
          <input
            type="number"
            min="1"
            value={usageForm.usedQuantity}
            onChange={(e) =>
              setUsageForm({ ...usageForm, usedQuantity: e.target.value })
            }
            placeholder="Enter quantity used"
          />
        </div>
        <div className="modal-actions">
          <button className="btn-primary" onClick={handleRecordUsage}>
            Record Usage
          </button>
          <button
            className="btn-secondary"
            onClick={() => setShowUsageModal(false)}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
