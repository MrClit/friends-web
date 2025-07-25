import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import ThemeInitializer from "./shared/components/ThemeInitializer";
import DemoInitializer from "./shared/components/DemoInitializer";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <ThemeInitializer />
      <DemoInitializer />
      <App />
    </I18nextProvider>
  </React.StrictMode>
);
