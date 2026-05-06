from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import traceback

from app.database import get_db
from app.schemas import ChatRequest, ChatResponse, ToolRequest
from app.agent.graph import agent_graph
from app.agent.tools import (
    tool_log_interaction,
    tool_edit_interaction,
    tool_fetch_hcp_profile,
    tool_suggest_next_action,
    tool_compliance_check,
)
from app.services.interaction_service import log_agent_action

router = APIRouter(prefix="/agent", tags=["Agent"])


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, db: Session = Depends(get_db)):
    """Main conversational endpoint – runs the full LangGraph workflow."""
    try:
        state = {
            "user_message": req.message,
            "db": db,
            "interaction_id": req.interaction_id,
        }
        result = agent_graph.invoke(state)

        intent = result.get("intent", "general_help")
        response_text = result.get("response", "")

        # Persist agent log
        log_agent_action(db, req.message, response_text, intent)

        return ChatResponse(
            reply=response_text,
            intent=intent,
            extracted_data=result.get("extracted_data"),
            tool_used=intent,
            interaction_id=result.get("interaction_id"),
        )
    except Exception as e:
        traceback.print_exc()
        return ChatResponse(
            reply=f"Sorry, an error occurred: {str(e)}",
            intent="error",
            extracted_data=None,
            tool_used=None,
            interaction_id=None,
        )


@router.post("/tool/log-interaction")
def direct_log_interaction(req: ToolRequest, db: Session = Depends(get_db)):
    """Directly invoke the Log Interaction tool."""
    try:
        result = tool_log_interaction(req.message, db, req.data)
        log_agent_action(db, req.message, str(result), "log_interaction")
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tool/edit-interaction")
def direct_edit_interaction(req: ToolRequest, db: Session = Depends(get_db)):
    """Directly invoke the Edit Interaction tool."""
    try:
        result = tool_edit_interaction(req.message, db, req.interaction_id, req.data)
        log_agent_action(db, req.message, str(result), "edit_interaction")
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tool/fetch-hcp")
def direct_fetch_hcp(req: ToolRequest, db: Session = Depends(get_db)):
    """Directly invoke the Fetch HCP Profile tool."""
    try:
        result = tool_fetch_hcp_profile(req.message, db)
        log_agent_action(db, req.message, str(result), "fetch_hcp_profile")
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tool/next-best-action")
def direct_next_best_action(req: ToolRequest, db: Session = Depends(get_db)):
    """Directly invoke the Suggest Next Best Action tool."""
    try:
        result = tool_suggest_next_action(req.message, db, req.interaction_id)
        log_agent_action(db, req.message, str(result), "suggest_next_best_action")
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tool/compliance-check")
def direct_compliance_check(req: ToolRequest, db: Session = Depends(get_db)):
    """Directly invoke the Compliance Check tool."""
    try:
        result = tool_compliance_check(req.message, db, req.data)
        log_agent_action(db, req.message, str(result), "compliance_check")
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
