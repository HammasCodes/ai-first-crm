from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ── HCP ──────────────────────────────────────────────────────────────────────

class HCPBase(BaseModel):
    name: str
    specialty: Optional[str] = None
    organization: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    territory: Optional[str] = None


class HCPCreate(HCPBase):
    pass


class HCPOut(HCPBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Interaction ──────────────────────────────────────────────────────────────

class InteractionBase(BaseModel):
    hcp_id: Optional[int] = None
    hcp_name: str
    specialty: Optional[str] = None
    organization: Optional[str] = None
    interaction_type: Optional[str] = None
    interaction_date: Optional[str] = None
    products_discussed: Optional[str] = None
    notes: Optional[str] = None
    ai_summary: Optional[str] = None
    sentiment: Optional[str] = None
    outcome: Optional[str] = None
    follow_up_required: Optional[bool] = False
    follow_up_date: Optional[str] = None
    samples_requested: Optional[str] = None


class InteractionCreate(InteractionBase):
    pass


class InteractionUpdate(BaseModel):
    hcp_name: Optional[str] = None
    specialty: Optional[str] = None
    organization: Optional[str] = None
    interaction_type: Optional[str] = None
    interaction_date: Optional[str] = None
    products_discussed: Optional[str] = None
    notes: Optional[str] = None
    ai_summary: Optional[str] = None
    sentiment: Optional[str] = None
    outcome: Optional[str] = None
    follow_up_required: Optional[bool] = None
    follow_up_date: Optional[str] = None
    samples_requested: Optional[str] = None


class InteractionOut(InteractionBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Agent ────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    interaction_id: Optional[int] = None


class ChatResponse(BaseModel):
    reply: str
    intent: Optional[str] = None
    extracted_data: Optional[dict] = None
    tool_used: Optional[str] = None
    interaction_id: Optional[int] = None


class ToolRequest(BaseModel):
    message: str
    interaction_id: Optional[int] = None
    data: Optional[dict] = None


class ComplianceResult(BaseModel):
    is_compliant: bool
    risk_level: str
    flagged_phrases: List[str]
    safer_rewrite: Optional[str] = None


class NextActionResult(BaseModel):
    suggested_actions: List[str]
    reasoning: str


class HCPProfile(BaseModel):
    hcp: Optional[dict] = None
    past_interactions: List[dict] = []
    last_interaction_date: Optional[str] = None
    known_product_interests: List[str] = []
