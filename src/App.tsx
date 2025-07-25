import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import EventDetail from "./pages/EventDetail";
import KPIDetail from "./pages/KPIDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/event/:id/kpi/:kpi" element={<KPIDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
