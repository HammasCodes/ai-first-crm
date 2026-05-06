import { useSelector, useDispatch } from "react-redux";
import { saveInteraction } from "../features/interactionSlice";
import { setDraftInteraction } from "../features/chatSlice";
import { FaEye, FaFileAlt, FaSave, FaCheckCircle, FaExclamationTriangle, FaBullseye } from "react-icons/fa";

export default function InteractionPreview() {
  const dispatch = useDispatch();
  const { draftInteraction, toolResult, lastIntent } = useSelector((s) => s.chat);

  const data = draftInteraction || {};
  const hasData = Object.keys(data).length > 0;

  // Check for compliance or next-action results
  const complianceResult = toolResult?.tool === "compliance-check" ? toolResult.result : null;
  const nextActionResult = toolResult?.tool === "next-best-action" ? toolResult.result : null;

  // Also check if lastIntent was compliance_check and toolResult came from chat
  const isComplianceFromChat = lastIntent === "compliance_check" && toolResult;
  const isNextActionFromChat = lastIntent === "suggest_next_best_action" && toolResult;

  const handleSaveDraft = () => {
    if (!data.hcp_name) return;
    dispatch(saveInteraction({
      hcp_name: data.hcp_name || "",
      specialty: data.specialty || "",
      organization: data.organization || "",
      interaction_type: data.interaction_type || "",
      interaction_date: data.interaction_date || "",
      products_discussed: data.products_discussed || "",
      notes: data.notes || "",
      ai_summary: data.ai_summary || data.summary || "",
      sentiment: data.sentiment || "",
      outcome: data.outcome || "",
      follow_up_required: data.follow_up_required || false,
      follow_up_date: data.follow_up_date || "",
      samples_requested: data.samples_requested || "",
    }));
    dispatch(setDraftInteraction(null));
  };

  const sentimentBadge = (sentiment) => {
    if (!sentiment) return null;
    const cls = sentiment.toLowerCase();
    return <span className={`badge badge-${cls}`}>{sentiment}</span>;
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2><span className="icon"><FaEye /></span> Interaction Preview</h2>
      </div>
      <div className="card-body">
        {!hasData && !complianceResult && !nextActionResult && (
          <div className="empty-state">
            <div className="icon"><FaFileAlt size={40} /></div>
            <p>No interaction data yet.</p>
            <p style={{ fontSize: "0.8rem", marginTop: 4, color: "var(--gray-400)" }}>
              Use the form or chat to generate a preview.
            </p>
          </div>
        )}

        {hasData && (
          <>
            <div className="preview-grid">
              {data.hcp_name && (
                <div className="preview-item">
                  <span className="label">HCP Name</span>
                  <span className="value">{data.hcp_name}</span>
                </div>
              )}
              {data.organization && (
                <div className="preview-item">
                  <span className="label">Organization</span>
                  <span className="value">{data.organization}</span>
                </div>
              )}
              {data.specialty && (
                <div className="preview-item">
                  <span className="label">Specialty</span>
                  <span className="value">{data.specialty}</span>
                </div>
              )}
              {data.interaction_type && (
                <div className="preview-item">
                  <span className="label">Type</span>
                  <span className="value">{data.interaction_type}</span>
                </div>
              )}
              {data.products_discussed && (
                <div className="preview-item">
                  <span className="label">Products</span>
                  <span className="value">{data.products_discussed}</span>
                </div>
              )}
              {data.sentiment && (
                <div className="preview-item">
                  <span className="label">Sentiment</span>
                  <span className="value">{sentimentBadge(data.sentiment)}</span>
                </div>
              )}
              {data.follow_up_required !== undefined && (
                <div className="preview-item">
                  <span className="label">Follow-up</span>
                  <span className="value">{data.follow_up_required ? `Yes${data.follow_up_date ? ` – ${data.follow_up_date}` : ""}` : "No"}</span>
                </div>
              )}
              {(data.ai_summary || data.summary || data.notes) && (
                <div className="preview-item full-width">
                  <span className="label">Summary / Notes</span>
                  <span className="value">{data.ai_summary || data.summary || data.notes}</span>
                </div>
              )}
            </div>
            <div className="btn-group">
              <button className="btn btn-success" onClick={handleSaveDraft} disabled={!data.hcp_name} id="save-draft-btn">
                <FaSave /> Save This Interaction
              </button>
            </div>
          </>
        )}

        {complianceResult && (
          <div className={`compliance-result ${complianceResult.is_compliant ? "compliant" : "non-compliant"}`}>
            <h4>{complianceResult.is_compliant ? <><FaCheckCircle /> Compliant</> : <><FaExclamationTriangle /> Non-Compliant</>}</h4>
            <p>Risk Level: <strong>{complianceResult.risk_level}</strong></p>
            {complianceResult.flagged_phrases?.length > 0 && (
              <div className="flagged">
                <strong>Flagged:</strong> {complianceResult.flagged_phrases.join(", ")}
              </div>
            )}
            {complianceResult.safer_rewrite && (
              <div className="rewrite">
                <strong>Safer version:</strong> {complianceResult.safer_rewrite}
              </div>
            )}
          </div>
        )}

        {nextActionResult && (
          <div style={{ marginTop: 12 }}>
            <h4 style={{ fontSize: "0.88rem", marginBottom: 8 }}><FaBullseye /> Suggested Actions</h4>
            <ul style={{ paddingLeft: 20, fontSize: "0.85rem", color: "var(--gray-700)" }}>
              {(nextActionResult.suggested_actions || []).map((a, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{a}</li>
              ))}
            </ul>
            {nextActionResult.reasoning && (
              <p style={{ marginTop: 8, fontSize: "0.82rem", color: "var(--gray-500)", fontStyle: "italic" }}>
                {nextActionResult.reasoning}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
