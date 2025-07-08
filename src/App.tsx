import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import EventDetail from "./pages/EventDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/event/:id" element={<EventDetail />} />
        {/* Aquí irán más rutas en el futuro */}
      </Routes>
    </BrowserRouter>
  );
}
