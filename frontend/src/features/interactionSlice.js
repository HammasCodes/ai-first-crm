import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchInteractions as apiFetch,
  createInteraction as apiCreate,
  updateInteraction as apiUpdate,
  deleteInteraction as apiDelete,
} from "../api/client";

export const loadInteractions = createAsyncThunk(
  "interactions/load",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiFetch();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to load interactions");
    }
  }
);

export const saveInteraction = createAsyncThunk(
  "interactions/save",
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiCreate(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to save");
    }
  }
);

export const editInteraction = createAsyncThunk(
  "interactions/edit",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await apiUpdate(id, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to update");
    }
  }
);

export const removeInteraction = createAsyncThunk(
  "interactions/remove",
  async (id, { rejectWithValue }) => {
    try {
      await apiDelete(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to delete");
    }
  }
);

const initialFormState = {
  hcp_name: "",
  specialty: "",
  organization: "",
  interaction_type: "",
  interaction_date: "",
  products_discussed: "",
  notes: "",
  samples_requested: "",
  follow_up_required: false,
  follow_up_date: "",
  sentiment: "",
  outcome: "",
};

const interactionSlice = createSlice({
  name: "interactions",
  initialState: {
    list: [],
    form: { ...initialFormState },
    loading: false,
    saving: false,
    error: null,
    successMsg: null,
  },
  reducers: {
    setFormField: (state, action) => {
      const { field, value } = action.payload;
      state.form[field] = value;
    },
    resetForm: (state) => {
      state.form = { ...initialFormState };
      state.successMsg = null;
      state.error = null;
    },
    setForm: (state, action) => {
      state.form = { ...initialFormState, ...action.payload };
    },
    clearMessages: (state) => {
      state.error = null;
      state.successMsg = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadInteractions.pending, (state) => { state.loading = true; })
      .addCase(loadInteractions.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(loadInteractions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(saveInteraction.pending, (state) => { state.saving = true; })
      .addCase(saveInteraction.fulfilled, (state, action) => {
        state.saving = false;
        state.list.unshift(action.payload);
        state.form = { ...initialFormState };
        state.successMsg = "Interaction saved successfully!";
      })
      .addCase(saveInteraction.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(editInteraction.fulfilled, (state, action) => {
        const idx = state.list.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
        state.successMsg = "Interaction updated!";
      })
      .addCase(removeInteraction.fulfilled, (state, action) => {
        state.list = state.list.filter((i) => i.id !== action.payload);
      });
  },
});

export const { setFormField, resetForm, setForm, clearMessages } = interactionSlice.actions;
export default interactionSlice.reducer;
