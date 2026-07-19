import "../../shared/qf-tokens.css";
import "../../shared/qf-base.css";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/App.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
