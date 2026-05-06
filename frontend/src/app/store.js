import { configureStore } from "@reduxjs/toolkit";
import interactionReducer from "../features/interactionSlice";
import chatReducer from "../features/chatSlice";

export const store = configureStore({
  reducer: {
    interactions: interactionReducer,
    chat: chatReducer,
  },
});
