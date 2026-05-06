import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// ── Interactions CRUD ───────────────────────────────────────────────────────

export const fetchInteractions = () => API.get("/interactions");
export const fetchInteraction = (id) => API.get(`/interactions/${id}`);
export const createInteraction = (data) => API.post("/interactions", data);
export const updateInteraction = (id, data) => API.put(`/interactions/${id}`, data);
export const deleteInteraction = (id) => API.delete(`/interactions/${id}`);

// ── Agent ───────────────────────────────────────────────────────────────────

export const agentChat = (message, interactionId) =>
  API.post("/agent/chat", { message, interaction_id: interactionId });

export const toolLogInteraction = (message, data) =>
  API.post("/agent/tool/log-interaction", { message, data });

export const toolEditInteraction = (message, interactionId, data) =>
  API.post("/agent/tool/edit-interaction", { message, interaction_id: interactionId, data });

export const toolFetchHCP = (message) =>
  API.post("/agent/tool/fetch-hcp", { message });

export const toolNextBestAction = (message, interactionId) =>
  API.post("/agent/tool/next-best-action", { message, interaction_id: interactionId });

export const toolComplianceCheck = (message, data) =>
  API.post("/agent/tool/compliance-check", { message, data });

export default API;
