import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import { fetchAuditLogs } from "../services/auditService";

function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const result = await fetchAuditLogs(200);
      setLogs(result);
    } catch {
      toast.error("Unable to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  if (loading) {
    return <Loader message="Loading audit logs..." />;
  }

  return (
    <div className="page-stack">
      <section className="page-header-row">
        <div>
          <h1>Audit Logs</h1>
          <p>System-wide history of mutating operations (Create, Update, Delete).</p>
        </div>
        <button type="button" className="outline-button" onClick={loadLogs}>
          Refresh
        </button>
      </section>

      <section className="panel-card">
        {!logs.length ? (
          <EmptyState title="No audit logs" subtitle="No mutating actions recorded yet." />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User UID</th>
                  <th>Action (Method)</th>
                  <th>Path</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>{log.userUid}</td>
                    <td><span className={`pill ${log.method === 'DELETE' ? 'danger' : 'success'}`}>{log.method}</span></td>
                    <td>{log.path}</td>
                    <td>{log.statusCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AuditLogsPage;
