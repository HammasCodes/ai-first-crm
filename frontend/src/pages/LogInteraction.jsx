import { useState } from "react";
import { useSelector } from "react-redux";
import { FaWpforms, FaRobot } from "react-icons/fa";

import InteractionForm from "../components/InteractionForm";
import ChatLogger from "../components/ChatLogger";
import InteractionPreview from "../components/InteractionPreview";
import SavedInteractions from "../components/SavedInteractions";
import ToolDemoPanel from "../components/ToolDemoPanel";

export default function LogInteraction() {
  const [activeTab, setActiveTab] = useState("form");

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h1>AI-First HCP Interaction Logger</h1>
        <p>Log, summarize, edit, and review HCP interactions using structured forms or AI chat.</p>
      </header>

      {/* Mode Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === "form" ? "active" : ""}`}
          onClick={() => setActiveTab("form")}
          id="tab-form"
        >
          <FaWpforms /> Structured Form
        </button>
        <button
          className={`tab-btn ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}
          id="tab-chat"
        >
          <FaRobot /> AI Chat Logger
        </button>
      </div>

      {/* Main Layout */}
      <div className="main-layout">
        <div>
          {activeTab === "form" && <InteractionForm />}
          {activeTab === "chat" && <ChatLogger />}

          {/* Tool Demo */}
          <ToolDemoPanel />

          {/* Saved Interactions */}
          <SavedInteractions />
        </div>

        {/* Side Panel */}
        <div className="side-panel">
          <InteractionPreview />
        </div>
      </div>
    </div>
  );
}
