import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/inventory", label: "Inventory" },
  { to: "/suppliers", label: "Suppliers" },
  { to: "/transactions", label: "Transactions" },
  { to: "/notifications", label: "Notifications" },
  { to: "/expiry", label: "Expiry & Wastage" },
  { to: "/departments", label: "Departments" },
  { to: "/compliance", label: "Compliance" },
  { to: "/audit", label: "Audit Logs" },
];

function Sidebar({ open, onClose }) {
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-top">
        <h2>MedStock</h2>
        <p>Medical College IMS</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? "active" : "")}
            onClick={onClose}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
