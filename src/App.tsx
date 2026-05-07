import { Analytics } from "@vercel/analytics/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { IncidentPage } from "./pages/IncidentPage";
import { TrendsPage } from "./pages/TrendsPage";
import { ChecklistPage } from "./pages/ChecklistPage";

export default function App() {
  return (
    <BrowserRouter>
      <Analytics />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/incident/:id" element={<IncidentPage />} />
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/checklist" element={<ChecklistPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
