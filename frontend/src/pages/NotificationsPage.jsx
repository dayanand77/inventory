import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import Loader from "../components/common/Loader";
import { useAuth } from "../context/AuthContext";
import {
  fetchNotifications,
  generateLowStockNotifications,
  markNotificationRead,
} from "../services/notificationService";
import { formatDate } from "../utils/formatters";

function NotificationsPage() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setItems(data);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      await loadNotifications();
    } catch {
      toast.error("Unable to mark notification as read");
    }
  };

  const generateAlerts = async () => {
    try {
      await generateLowStockNotifications();
      toast.success("Low stock alerts generated");
      await loadNotifications();
    } catch {
      toast.error("Failed to generate low stock alerts");
    }
  };

  if (loading) {
    return <Loader message="Loading notifications..." />;
  }

  return (
    <div className="page-stack">
      <section className="page-header-row">
        <div>
          <h1>Notifications</h1>
          <p>Low stock alerts and inventory activity notifications.</p>
        </div>
        {isAdmin && (
          <button type="button" className="primary-button" onClick={generateAlerts}>
            Generate Low Stock Alerts
          </button>
        )}
      </section>

      <section className="panel-card">
        <div className="list-panel">
          {items.map((item) => (
            <article key={item._id} className={`notification-card ${item.isRead ? "is-read" : ""}`}>
              <div>
                <strong>{item.type.replace("_", " ")}</strong>
                <p>{item.message}</p>
                <small>{formatDate(item.createdAt)}</small>
              </div>
              {!item.isRead && (
                <button type="button" className="outline-button" onClick={() => markRead(item._id)}>
                  Mark as Read
                </button>
              )}
            </article>
          ))}
          {!items.length && <p>No notifications available.</p>}
        </div>
      </section>
    </div>
  );
}

export default NotificationsPage;
