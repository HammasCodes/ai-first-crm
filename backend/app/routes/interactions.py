from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas import InteractionCreate, InteractionUpdate, InteractionOut
from app.services.interaction_service import (
    create_interaction,
    get_interactions,
    get_interaction,
    update_interaction,
    delete_interaction,
)

router = APIRouter(prefix="/interactions", tags=["Interactions"])


@router.post("", response_model=InteractionOut)
def create(data: InteractionCreate, db: Session = Depends(get_db)):
    return create_interaction(db, data)


@router.get("", response_model=List[InteractionOut])
def list_all(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_interactions(db, skip, limit)


@router.get("/{interaction_id}", response_model=InteractionOut)
def read(interaction_id: int, db: Session = Depends(get_db)):
    item = get_interaction(db, interaction_id)
    if not item:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return item


@router.put("/{interaction_id}", response_model=InteractionOut)
def update(interaction_id: int, data: InteractionUpdate, db: Session = Depends(get_db)):
    item = update_interaction(db, interaction_id, data)
    if not item:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return item


@router.delete("/{interaction_id}")
def delete(interaction_id: int, db: Session = Depends(get_db)):
    ok = delete_interaction(db, interaction_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Interaction not found")
    return {"detail": "Deleted"}
