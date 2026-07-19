import "../../shared/qf-tokens.css";
import "../../shared/qf-base.css";
import { createRoot } from "react-dom/client";
import { initDarkMode } from "@collab/shared/dark-mode";
import "@collab/theme/styles.css";
import "./styles.css";
import { installDevShim } from "./dev-shim";
import App from "./App";

// Install mock API when running outside Electron
installDevShim();
initDarkMode();

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
