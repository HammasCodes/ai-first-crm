import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  agentChat,
  toolLogInteraction,
  toolEditInteraction,
  toolFetchHCP,
  toolNextBestAction,
  toolComplianceCheck,
} from "../api/client";

export const sendChatMessage = createAsyncThunk(
  "chat/send",
  async ({ message, interactionId }, { rejectWithValue }) => {
    try {
      const res = await agentChat(message, interactionId);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Chat request failed");
    }
  }
);

export const invokeTool = createAsyncThunk(
  "chat/invokeTool",
  async ({ tool, message, interactionId, data }, { rejectWithValue }) => {
    try {
      let res;
      switch (tool) {
        case "log-interaction":
          res = await toolLogInteraction(message, data);
          break;
        case "edit-interaction":
          res = await toolEditInteraction(message, interactionId, data);
          break;
        case "fetch-hcp":
          res = await toolFetchHCP(message);
          break;
        case "next-best-action":
          res = await toolNextBestAction(message, interactionId);
          break;
        case "compliance-check":
          res = await toolComplianceCheck(message, data);
          break;
        default:
          throw new Error("Unknown tool");
      }
      return { tool, result: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Tool invocation failed");
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    messages: [],
    loading: false,
    error: null,
    draftInteraction: null,
    toolResult: null,
    lastIntent: null,
    lastInteractionId: null,
  },
  reducers: {
    addUserMessage: (state, action) => {
      state.messages.push({ role: "user", content: action.payload });
    },
    clearChat: (state) => {
      state.messages = [];
      state.draftInteraction = null;
      state.toolResult = null;
      state.error = null;
      state.lastIntent = null;
      state.lastInteractionId = null;
    },
    clearToolResult: (state) => {
      state.toolResult = null;
    },
    setDraftInteraction: (state, action) => {
      state.draftInteraction = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.loading = false;
        const { reply, intent, extracted_data, interaction_id } = action.payload;
        state.messages.push({ role: "assistant", content: reply });
        state.lastIntent = intent;
        state.lastInteractionId = interaction_id;
        if (extracted_data) {
          state.draftInteraction = extracted_data;
        }
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.messages.push({ role: "assistant", content: `Error: ${action.payload}` });
      })
      .addCase(invokeTool.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(invokeTool.fulfilled, (state, action) => {
        state.loading = false;
        state.toolResult = action.payload;
        const toolName = action.payload.tool;
        const result = action.payload.result;
        state.messages.push({
          role: "assistant",
          content: `**${toolName}** result:\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``,
        });
      })
      .addCase(invokeTool.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { addUserMessage, clearChat, clearToolResult, setDraftInteraction } = chatSlice.actions;
export default chatSlice.reducer;
