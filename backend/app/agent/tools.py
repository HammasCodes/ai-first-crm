"""
LangGraph tools – each tool performs a real CRM action backed by the database
and uses the Groq LLM for reasoning where appropriate.
"""

import json
import re
from sqlalchemy.orm import Session
from langchain_groq import ChatGroq

from app.config import GROQ_API_KEY, GROQ_MODEL
from app.models import Interaction, HCP
from app.schemas import InteractionCreate, InteractionUpdate
from app.services.interaction_service import (
    create_interaction,
    update_interaction,
    get_hcp_by_name,
    get_hcp_interactions,
    get_interaction,
)
from app.agent.prompts import (
    INTERACTION_EXTRACTION_PROMPT,
    SUMMARY_GENERATION_PROMPT,
    COMPLIANCE_CHECK_PROMPT,
    NEXT_BEST_ACTION_PROMPT,
    EDIT_EXTRACTION_PROMPT,
    HCP_PROFILE_SEARCH_PROMPT,
)


# Cached LLM singleton – avoids re-creating the client on every call
_llm_instance = None

def _get_llm():
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = ChatGroq(
            api_key=GROQ_API_KEY,
            model_name=GROQ_MODEL,
            temperature=0.1,
            max_tokens=512,
            request_timeout=15,
        )
    return _llm_instance


def _safe_parse_json(text: str) -> dict:
    """Try to parse JSON from LLM output, handling markdown fences."""
    text = text.strip()
    # Remove markdown code fences
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Attempt to find first { ... } block
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
    return {}


# ── Tool 1: Log Interaction ─────────────────────────────────────────────────

def tool_log_interaction(user_message: str, db: Session, data: dict | None = None) -> dict:
    """Extract interaction details from natural language and save to database."""
    llm = _get_llm()

    if data and data.get("hcp_name"):
        extracted = data
    else:
        prompt = INTERACTION_EXTRACTION_PROMPT.format(message=user_message)
        response = llm.invoke(prompt)
        extracted = _safe_parse_json(response.content)

    if not extracted.get("hcp_name"):
        return {"error": "Could not extract HCP name from the message. Please provide more details."}

    # Generate AI summary
    summary_prompt = SUMMARY_GENERATION_PROMPT.format(details=json.dumps(extracted, indent=2))
    summary_resp = llm.invoke(summary_prompt)
    summary_data = _safe_parse_json(summary_resp.content)
    extracted["ai_summary"] = summary_data.get("summary", "")

    # Clean None strings
    clean = {}
    for k, v in extracted.items():
        if v is None or v == "null":
            continue
        clean[k] = v

    interaction_data = InteractionCreate(**{
        "hcp_name": clean.get("hcp_name", "Unknown"),
        "specialty": clean.get("specialty"),
        "organization": clean.get("organization"),
        "interaction_type": clean.get("interaction_type"),
        "interaction_date": clean.get("interaction_date"),
        "products_discussed": clean.get("products_discussed"),
        "notes": clean.get("notes"),
        "ai_summary": clean.get("ai_summary"),
        "sentiment": clean.get("sentiment"),
        "outcome": clean.get("outcome"),
        "follow_up_required": clean.get("follow_up_required", False),
        "follow_up_date": clean.get("follow_up_date"),
        "samples_requested": clean.get("samples_requested"),
    })

    saved = create_interaction(db, interaction_data)
    return {
        "message": f"Interaction logged successfully for {saved.hcp_name}.",
        "interaction_id": saved.id,
        "extracted_data": clean,
    }


# ── Tool 2: Edit Interaction ────────────────────────────────────────────────

def tool_edit_interaction(user_message: str, db: Session, interaction_id: int | None = None, data: dict | None = None) -> dict:
    """Edit an existing interaction based on user instructions."""
    llm = _get_llm()

    # If no interaction_id provided, try the latest
    if not interaction_id:
        latest = db.query(Interaction).order_by(Interaction.id.desc()).first()
        if not latest:
            return {"error": "No interactions found to edit."}
        interaction_id = latest.id

    existing = get_interaction(db, interaction_id)
    if not existing:
        return {"error": f"Interaction {interaction_id} not found."}

    if data:
        updates = data
    else:
        prompt = EDIT_EXTRACTION_PROMPT.format(message=user_message)
        response = llm.invoke(prompt)
        updates = _safe_parse_json(response.content)

    if not updates:
        return {"error": "Could not determine what to update. Please be more specific."}

    update_data = InteractionUpdate(**{k: v for k, v in updates.items() if v is not None and v != "null"})
    updated = update_interaction(db, interaction_id, update_data)

    return {
        "message": f"Interaction {interaction_id} updated successfully.",
        "interaction_id": interaction_id,
        "updated_fields": updates,
    }


# ── Tool 3: Fetch HCP Profile ───────────────────────────────────────────────

def tool_fetch_hcp_profile(user_message: str, db: Session) -> dict:
    """Retrieve HCP profile and interaction history."""
    llm = _get_llm()

    prompt = HCP_PROFILE_SEARCH_PROMPT.format(message=user_message)
    response = llm.invoke(prompt)
    parsed = _safe_parse_json(response.content)
    hcp_name = parsed.get("hcp_name", "")

    if not hcp_name:
        return {"error": "Could not identify which HCP you're asking about."}

    # Look up HCP record
    hcp = get_hcp_by_name(db, hcp_name)
    hcp_data = None
    if hcp:
        hcp_data = {
            "id": hcp.id,
            "name": hcp.name,
            "specialty": hcp.specialty,
            "organization": hcp.organization,
            "email": hcp.email,
            "phone": hcp.phone,
            "territory": hcp.territory,
        }

    # Get past interactions
    interactions = get_hcp_interactions(db, hcp_name)
    interaction_list = []
    products = set()
    last_date = None
    for ix in interactions:
        interaction_list.append({
            "id": ix.id,
            "date": ix.interaction_date,
            "type": ix.interaction_type,
            "products": ix.products_discussed,
            "sentiment": ix.sentiment,
            "summary": ix.ai_summary,
        })
        if ix.products_discussed:
            products.update([p.strip() for p in ix.products_discussed.split(",")])
        if ix.interaction_date:
            last_date = ix.interaction_date

    return {
        "hcp": hcp_data or {"name": hcp_name, "note": "No HCP record found in database, but interactions may exist."},
        "past_interactions": interaction_list,
        "last_interaction_date": last_date,
        "known_product_interests": list(products),
    }


# ── Tool 4: Suggest Next Best Action ────────────────────────────────────────

def tool_suggest_next_action(user_message: str, db: Session, interaction_id: int | None = None) -> dict:
    """Use LLM reasoning to suggest next steps for the field rep."""
    llm = _get_llm()

    context_parts = [f"User request: {user_message}"]

    if interaction_id:
        ix = get_interaction(db, interaction_id)
        if ix:
            context_parts.append(f"HCP: {ix.hcp_name}, Org: {ix.organization}")
            context_parts.append(f"Products: {ix.products_discussed}")
            context_parts.append(f"Notes: {ix.notes}")
            context_parts.append(f"Sentiment: {ix.sentiment}")
            context_parts.append(f"Follow-up required: {ix.follow_up_required}")
    else:
        latest = db.query(Interaction).order_by(Interaction.id.desc()).first()
        if latest:
            context_parts.append(f"Latest HCP: {latest.hcp_name}, Org: {latest.organization}")
            context_parts.append(f"Products: {latest.products_discussed}")
            context_parts.append(f"Notes: {latest.notes}")
            context_parts.append(f"Sentiment: {latest.sentiment}")

    prompt = NEXT_BEST_ACTION_PROMPT.format(context="\n".join(context_parts))
    response = llm.invoke(prompt)
    result = _safe_parse_json(response.content)

    return {
        "suggested_actions": result.get("suggested_actions", ["Schedule a follow-up call"]),
        "reasoning": result.get("reasoning", "Based on the interaction context."),
    }


# ── Tool 5: Compliance Check ────────────────────────────────────────────────

def tool_compliance_check(user_message: str, db: Session = None, data: dict | None = None) -> dict:
    """Check notes for compliance issues using LLM reasoning."""
    llm = _get_llm()

    notes = user_message
    if data and data.get("notes"):
        notes = data["notes"]

    prompt = COMPLIANCE_CHECK_PROMPT.format(notes=notes)
    response = llm.invoke(prompt)
    result = _safe_parse_json(response.content)

    return {
        "is_compliant": result.get("is_compliant", True),
        "risk_level": result.get("risk_level", "low"),
        "flagged_phrases": result.get("flagged_phrases", []),
        "safer_rewrite": result.get("safer_rewrite"),
    }
