import { Outlet } from "react-router-dom";
import { useState } from "react";

import Header from "./Header";
import Sidebar from "./Sidebar";

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Header onMenuClick={() => setSidebarOpen((state) => !state)} />
        <main className="content-wrapper">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
