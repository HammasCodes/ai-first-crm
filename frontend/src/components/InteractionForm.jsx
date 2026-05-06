import { useSelector, useDispatch } from "react-redux";
import {
  setFormField,
  resetForm,
  saveInteraction,
} from "../features/interactionSlice";
import { sendChatMessage } from "../features/chatSlice";
import { 
  FaWpforms, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaSave, 
  FaMagic, 
  FaShieldAlt, 
  FaBullseye 
} from "react-icons/fa";

const INTERACTION_TYPES = [
  "In-person visit",
  "Phone call",
  "Email",
  "Conference meeting",
  "Virtual meeting",
];

const SENTIMENTS = ["Positive", "Neutral", "Negative"];

export default function InteractionForm() {
  const dispatch = useDispatch();
  const { form, saving, successMsg, error, loadingAI } = useSelector((s) => s.interactions);

  const handleChange = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    dispatch(setFormField({ field, value }));
  };

  const handleSave = () => {
    if (!form.hcp_name.trim()) return;
    dispatch(saveInteraction(form));
  };

  const handleSummary = () => {
    const msg = `Summarize this interaction: HCP ${form.hcp_name} at ${form.organization}, discussed ${form.products_discussed}. Notes: ${form.notes}`;
    dispatch(sendChatMessage({ message: msg }));
  };

  const handleCompliance = () => {
    const msg = `Check this note for compliance: ${form.notes || form.outcome || "No notes entered"}`;
    dispatch(sendChatMessage({ message: msg }));
  };

  const handleNextAction = () => {
    const msg = `What should I do next for ${form.hcp_name || "this doctor"}? Products discussed: ${form.products_discussed}. Sentiment: ${form.sentiment}. Notes: ${form.notes}`;
    dispatch(sendChatMessage({ message: msg }));
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2><span className="icon"><FaWpforms /></span> Structured Interaction Form</h2>
        <button className="btn btn-ghost" onClick={() => dispatch(resetForm())}>
          Reset
        </button>
      </div>
      <div className="card-body">
        {successMsg && <div className="alert alert-success"><FaCheckCircle /> {successMsg}</div>}
        {error && <div className="alert alert-error"><FaTimesCircle /> {error}</div>}

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="hcp_name">HCP Name *</label>
            <input id="hcp_name" value={form.hcp_name} onChange={handleChange("hcp_name")} placeholder="e.g. Dr. Sharma" />
          </div>

          <div className="form-group">
            <label htmlFor="specialty">Specialty</label>
            <input id="specialty" value={form.specialty} onChange={handleChange("specialty")} placeholder="e.g. Cardiology" />
          </div>

          <div className="form-group">
            <label htmlFor="organization">Organization / Clinic</label>
            <input id="organization" value={form.organization} onChange={handleChange("organization")} placeholder="e.g. City Care Hospital" />
          </div>

          <div className="form-group">
            <label htmlFor="interaction_type">Interaction Type</label>
            <select id="interaction_type" value={form.interaction_type} onChange={handleChange("interaction_type")}>
              <option value="">Select type...</option>
              {INTERACTION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="interaction_date">Interaction Date</label>
            <input id="interaction_date" type="date" value={form.interaction_date} onChange={handleChange("interaction_date")} />
          </div>

          <div className="form-group">
            <label htmlFor="products_discussed">Products Discussed</label>
            <input id="products_discussed" value={form.products_discussed} onChange={handleChange("products_discussed")} placeholder="e.g. CardioMax, OncoShield" />
          </div>

          <div className="form-group full-width">
            <label htmlFor="notes">Discussion Notes</label>
            <textarea id="notes" value={form.notes} onChange={handleChange("notes")} placeholder="Key discussion points, observations..." rows={3} />
          </div>

          <div className="form-group">
            <label htmlFor="samples_requested">Samples Requested</label>
            <input id="samples_requested" value={form.samples_requested} onChange={handleChange("samples_requested")} placeholder="e.g. CardioMax starter pack" />
          </div>

          <div className="form-group">
            <label htmlFor="sentiment">Sentiment</label>
            <select id="sentiment" value={form.sentiment} onChange={handleChange("sentiment")}>
              <option value="">Select sentiment...</option>
              {SENTIMENTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="form-group checkbox-group">
            <input id="follow_up_required" type="checkbox" checked={form.follow_up_required} onChange={handleChange("follow_up_required")} />
            <label htmlFor="follow_up_required" style={{textTransform: 'none', fontSize: '0.88rem'}}>Follow-up Required</label>
          </div>

          {form.follow_up_required && (
            <div className="form-group">
              <label htmlFor="follow_up_date">Follow-up Date</label>
              <input id="follow_up_date" type="date" value={form.follow_up_date} onChange={handleChange("follow_up_date")} />
            </div>
          )}

          <div className="form-group full-width">
            <label htmlFor="outcome">Outcome</label>
            <textarea id="outcome" value={form.outcome} onChange={handleChange("outcome")} placeholder="Outcome or next steps..." rows={2} />
          </div>
        </div>

        <div className="btn-group">
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving || !form.hcp_name.trim()}>
            {saving ? <><span className="spinner"></span> Saving...</> : <><FaSave /> Save Interaction</>}
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleSummary} disabled={loadingAI?.summary || !form.hcp_name.trim()}>
            {loadingAI?.summary ? <><span className="spinner"></span> Generating...</> : <><FaMagic /> Generate AI Summary</>}
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleCompliance} disabled={loadingAI?.compliance}>
            {loadingAI?.compliance ? <><span className="spinner"></span> Checking...</> : <><FaShieldAlt /> Check Compliance</>}
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleNextAction} disabled={loadingAI?.nextAction}>
            {loadingAI?.nextAction ? <><span className="spinner"></span> Analyzing...</> : <><FaBullseye /> Suggest Next Action</>}
          </button>
        </div>
      </div>
    </div>
  );
}
