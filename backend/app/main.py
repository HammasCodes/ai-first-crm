from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback

from app.database import engine, Base, SessionLocal
from app.models import HCP, Interaction
from app.routes import interactions, agent

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI-First HCP CRM",
    description="LangGraph-powered CRM module for Healthcare Professional interactions",
    version="1.0.0",
)

# CORS – allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all so unhandled errors still return proper CORS JSON responses."""
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        },
    )


# Register routers
app.include_router(interactions.router)
app.include_router(agent.router)


@app.on_event("startup")
def seed_data():
    """Insert sample data if the database is empty."""
    db = SessionLocal()
    try:
        if db.query(HCP).count() == 0:
            sample_hcps = [
                HCP(name="Dr. Sharma", specialty="Cardiology", organization="City Care Hospital",
                    email="sharma@citycare.com", phone="+91-9876543210", territory="North"),
                HCP(name="Dr. Patel", specialty="Oncology", organization="MedLife Clinic",
                    email="patel@medlife.com", phone="+91-9876543211", territory="West"),
                HCP(name="Dr. Gupta", specialty="Neurology", organization="NeuroHealth Center",
                    email="gupta@neurohealth.com", phone="+91-9876543212", territory="East"),
                HCP(name="Dr. Reddy", specialty="Endocrinology", organization="Metro Hospital",
                    email="reddy@metrohospital.com", phone="+91-9876543213", territory="South"),
            ]
            db.add_all(sample_hcps)
            db.commit()

        if db.query(Interaction).count() == 0:
            sample_interactions = [
                Interaction(
                    hcp_name="Dr. Sharma", specialty="Cardiology",
                    organization="City Care Hospital", interaction_type="In-person visit",
                    interaction_date="2026-04-28", products_discussed="CardioMax",
                    notes="Discussed efficacy data for CardioMax. Dr. Sharma expressed strong interest.",
                    ai_summary="Dr. Sharma showed positive interest in CardioMax during an in-person visit at City Care Hospital.",
                    sentiment="Positive", outcome="Requested clinical trial data",
                    follow_up_required=True, follow_up_date="2026-05-09",
                ),
                Interaction(
                    hcp_name="Dr. Patel", specialty="Oncology",
                    organization="MedLife Clinic", interaction_type="Virtual meeting",
                    interaction_date="2026-04-25", products_discussed="OncoShield",
                    notes="Reviewed Phase III results. Dr. Patel was cautious but open.",
                    ai_summary="Virtual meeting with Dr. Patel covering OncoShield Phase III results. Cautious but receptive.",
                    sentiment="Neutral", outcome="Will review data internally",
                    follow_up_required=True, follow_up_date="2026-05-12",
                ),
                Interaction(
                    hcp_name="Dr. Gupta", specialty="Neurology",
                    organization="NeuroHealth Center", interaction_type="Phone call",
                    interaction_date="2026-04-20", products_discussed="NeuroCalm",
                    notes="Brief call. Dr. Gupta mentioned concerns about side effect profile.",
                    ai_summary="Phone call with Dr. Gupta regarding NeuroCalm. Raised side effect concerns.",
                    sentiment="Negative", outcome="Needs more safety data",
                    follow_up_required=True, follow_up_date="2026-05-05",
                ),
            ]
            db.add_all(sample_interactions)
            db.commit()
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "AI-First HCP CRM API is running", "docs": "/docs"}

