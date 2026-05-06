from sqlalchemy.orm import Session
from app.models import Interaction, HCP, AgentLog
from app.schemas import InteractionCreate, InteractionUpdate


def create_interaction(db: Session, data: InteractionCreate) -> Interaction:
    interaction = Interaction(**data.model_dump())
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return interaction


def get_interactions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Interaction).order_by(Interaction.created_at.desc()).offset(skip).limit(limit).all()


def get_interaction(db: Session, interaction_id: int):
    return db.query(Interaction).filter(Interaction.id == interaction_id).first()


def update_interaction(db: Session, interaction_id: int, data: InteractionUpdate) -> Interaction | None:
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(interaction, key, value)
    db.commit()
    db.refresh(interaction)
    return interaction


def delete_interaction(db: Session, interaction_id: int) -> bool:
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        return False
    db.delete(interaction)
    db.commit()
    return True


def get_hcp_by_name(db: Session, name: str):
    return db.query(HCP).filter(HCP.name.ilike(f"%{name}%")).first()


def get_hcp_interactions(db: Session, hcp_name: str):
    return db.query(Interaction).filter(
        Interaction.hcp_name.ilike(f"%{hcp_name}%")
    ).order_by(Interaction.created_at.desc()).all()


def log_agent_action(db: Session, user_message: str, agent_response: str, tool_used: str):
    log = AgentLog(user_message=user_message, agent_response=agent_response, tool_used=tool_used)
    db.add(log)
    db.commit()
    return log
