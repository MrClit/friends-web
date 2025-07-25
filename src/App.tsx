import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import EventDetail from "./pages/EventDetail";
import KPIDetail from "./pages/KPIDetail";

const Router =
  import.meta.env.MODE === "production" ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/event/:id/kpi/:kpi" element={<KPIDetail />} />
      </Routes>
    </Router>
  );
}
