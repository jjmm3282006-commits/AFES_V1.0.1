import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { logVerificationReport, getDataSummary } from "./utils/dataVerification";

// Verify data integrity on startup
console.log('=== AFES System Initialization ===');
const summary = getDataSummary();
console.log('Data Summary:', summary);
logVerificationReport();
console.log('==================================\n');

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
