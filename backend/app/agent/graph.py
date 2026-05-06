"""
LangGraph workflow for the HCP CRM agent.

The graph:
  1. classify_intent  →  (conditional edge)
  2. route to tool node based on intent
  3. compose_response
  4. END
"""

from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq

from app.config import GROQ_API_KEY, GROQ_MODEL
from app.agent.prompts import INTENT_CLASSIFICATION_PROMPT
from app.agent.tools import (
    tool_log_interaction,
    tool_edit_interaction,
    tool_fetch_hcp_profile,
    tool_suggest_next_action,
    tool_compliance_check,
    _safe_parse_json,
)


# ── Agent State ──────────────────────────────────────────────────────────────

class AgentState(TypedDict, total=False):
    user_message: str
    intent: str
    extracted_data: Optional[dict]
    tool_result: Optional[dict]
    response: Optional[str]
    interaction_id: Optional[int]
    db: object  # SQLAlchemy session (passed through state)
    data: Optional[dict]  # Extra structured data from request


# ── Node Functions ───────────────────────────────────────────────────────────

def classify_intent(state: AgentState) -> AgentState:
    """Use Groq LLM to determine what the user wants to do."""
    llm = ChatGroq(api_key=GROQ_API_KEY, model_name=GROQ_MODEL, temperature=0)
    prompt = INTENT_CLASSIFICATION_PROMPT.format(message=state["user_message"])
    response = llm.invoke(prompt)
    parsed = _safe_parse_json(response.content)
    state["intent"] = parsed.get("intent", "general_help")
    return state


def run_log_interaction(state: AgentState) -> AgentState:
    result = tool_log_interaction(state["user_message"], state["db"], state.get("data"))
    state["tool_result"] = result
    state["extracted_data"] = result.get("extracted_data")
    state["interaction_id"] = result.get("interaction_id")
    return state


def run_edit_interaction(state: AgentState) -> AgentState:
    result = tool_edit_interaction(
        state["user_message"], state["db"],
        state.get("interaction_id"), state.get("data"),
    )
    state["tool_result"] = result
    state["interaction_id"] = result.get("interaction_id")
    return state


def run_fetch_hcp_profile(state: AgentState) -> AgentState:
    result = tool_fetch_hcp_profile(state["user_message"], state["db"])
    state["tool_result"] = result
    return state


def run_suggest_next_action(state: AgentState) -> AgentState:
    result = tool_suggest_next_action(
        state["user_message"], state["db"], state.get("interaction_id"),
    )
    state["tool_result"] = result
    return state


def run_compliance_check(state: AgentState) -> AgentState:
    result = tool_compliance_check(state["user_message"], state["db"], state.get("data"))
    state["tool_result"] = result
    return state


def run_general_help(state: AgentState) -> AgentState:
    """Handle greetings and general questions using the LLM."""
    llm = ChatGroq(api_key=GROQ_API_KEY, model_name=GROQ_MODEL, temperature=0.3)
    response = llm.invoke(
        f"You are a helpful life-science CRM assistant. Answer concisely: {state['user_message']}"
    )
    state["tool_result"] = {"message": response.content}
    return state


def compose_response(state: AgentState) -> AgentState:
    """Build the final user-facing response string."""
    result = state.get("tool_result", {})
    if "error" in result:
        state["response"] = f"⚠️ {result['error']}"
    elif "message" in result:
        state["response"] = result["message"]
    else:
        state["response"] = "Done. Here are the results."
    return state


# ── Routing ──────────────────────────────────────────────────────────────────

def route_by_intent(state: AgentState) -> str:
    """Conditional edge – pick the right tool node."""
    mapping = {
        "log_interaction": "log_interaction",
        "edit_interaction": "edit_interaction",
        "fetch_hcp_profile": "fetch_hcp_profile",
        "suggest_next_best_action": "suggest_next_action",
        "compliance_check": "compliance_check",
        "general_help": "general_help",
    }
    return mapping.get(state.get("intent", "general_help"), "general_help")


# ── Build Graph ──────────────────────────────────────────────────────────────

def build_agent_graph():
    graph = StateGraph(AgentState)

    # Add nodes
    graph.add_node("classify_intent", classify_intent)
    graph.add_node("log_interaction", run_log_interaction)
    graph.add_node("edit_interaction", run_edit_interaction)
    graph.add_node("fetch_hcp_profile", run_fetch_hcp_profile)
    graph.add_node("suggest_next_action", run_suggest_next_action)
    graph.add_node("compliance_check", run_compliance_check)
    graph.add_node("general_help", run_general_help)
    graph.add_node("compose_response", compose_response)

    # Entry point
    graph.set_entry_point("classify_intent")

    # Conditional routing from intent classification
    graph.add_conditional_edges(
        "classify_intent",
        route_by_intent,
        {
            "log_interaction": "log_interaction",
            "edit_interaction": "edit_interaction",
            "fetch_hcp_profile": "fetch_hcp_profile",
            "suggest_next_action": "suggest_next_action",
            "compliance_check": "compliance_check",
            "general_help": "general_help",
        },
    )

    # All tool nodes flow to compose_response
    for node in ["log_interaction", "edit_interaction", "fetch_hcp_profile",
                  "suggest_next_action", "compliance_check", "general_help"]:
        graph.add_edge(node, "compose_response")

    graph.add_edge("compose_response", END)

    return graph.compile()


# Singleton compiled graph
agent_graph = build_agent_graph()
