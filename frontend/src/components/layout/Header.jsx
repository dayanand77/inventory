import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="top-bar">
      <button type="button" className="menu-toggle" onClick={onMenuClick}>
        Menu
      </button>
      <div className="top-bar-right">
        <div>
          <strong>{profile?.displayName || profile?.email || "User"}</strong>
          <p>{profile?.role || "-"}</p>
        </div>
        <button type="button" className="outline-button" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </header>
  );
}

export default Header;
