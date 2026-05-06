import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { loadInteractions, removeInteraction } from "../features/interactionSlice";
import { FaFolderOpen, FaSync, FaInbox } from "react-icons/fa";

export default function SavedInteractions() {
  const dispatch = useDispatch();
  const { list, loading } = useSelector((s) => s.interactions);
  const [viewItem, setViewItem] = useState(null);

  useEffect(() => {
    dispatch(loadInteractions());
  }, [dispatch]);

  const sentimentBadge = (s) => {
    if (!s) return "—";
    const cls = s.toLowerCase();
    return <span className={`badge badge-${cls}`}>{s}</span>;
  };

  return (
    <>
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <h2><span className="icon"><FaFolderOpen /></span> Saved Interactions</h2>
          <button className="btn btn-ghost" onClick={() => dispatch(loadInteractions())} id="refresh-interactions-btn">
            <FaSync /> Refresh
          </button>
        </div>
        <div className="card-body" style={{ padding: 0, overflowX: "auto" }}>
          {loading ? (
            <div className="empty-state"><span className="spinner"></span></div>
          ) : list.length === 0 ? (
            <div className="empty-state">
              <div className="icon"><FaInbox size={40} /></div>
              <p>No interactions saved yet.</p>
            </div>
          ) : (
            <table className="interactions-table">
              <thead>
                <tr>
                  <th>HCP Name</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Product</th>
                  <th>Sentiment</th>
                  <th>Outcome</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((ix) => (
                  <tr key={ix.id}>
                    <td style={{ fontWeight: 600, color: "var(--gray-800)" }}>{ix.hcp_name}</td>
                    <td>{ix.interaction_date || "—"}</td>
                    <td>{ix.interaction_type || "—"}</td>
                    <td>{ix.products_discussed || "—"}</td>
                    <td>{sentimentBadge(ix.sentiment)}</td>
                    <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ix.outcome || "—"}
                    </td>
                    <td>
                      <button className="btn btn-ghost" onClick={() => setViewItem(ix)} style={{ fontSize: "0.78rem" }}>
                        View
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ color: "var(--danger)", fontSize: "0.78rem" }}
                        onClick={() => dispatch(removeInteraction(ix.id))}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewItem && (
        <div className="modal-overlay" onClick={() => setViewItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Interaction Details – {viewItem.hcp_name}</h2>
            <div className="preview-grid">
              <div className="preview-item">
                <span className="label">HCP Name</span>
                <span className="value">{viewItem.hcp_name}</span>
              </div>
              <div className="preview-item">
                <span className="label">Organization</span>
                <span className="value">{viewItem.organization || "—"}</span>
              </div>
              <div className="preview-item">
                <span className="label">Specialty</span>
                <span className="value">{viewItem.specialty || "—"}</span>
              </div>
              <div className="preview-item">
                <span className="label">Type</span>
                <span className="value">{viewItem.interaction_type || "—"}</span>
              </div>
              <div className="preview-item">
                <span className="label">Date</span>
                <span className="value">{viewItem.interaction_date || "—"}</span>
              </div>
              <div className="preview-item">
                <span className="label">Products</span>
                <span className="value">{viewItem.products_discussed || "—"}</span>
              </div>
              <div className="preview-item">
                <span className="label">Sentiment</span>
                <span className="value">{sentimentBadge(viewItem.sentiment)}</span>
              </div>
              <div className="preview-item">
                <span className="label">Follow-up</span>
                <span className="value">
                  {viewItem.follow_up_required ? `Yes – ${viewItem.follow_up_date || "TBD"}` : "No"}
                </span>
              </div>
              <div className="preview-item full-width">
                <span className="label">Notes</span>
                <span className="value">{viewItem.notes || "—"}</span>
              </div>
              <div className="preview-item full-width">
                <span className="label">AI Summary</span>
                <span className="value">{viewItem.ai_summary || "—"}</span>
              </div>
              <div className="preview-item full-width">
                <span className="label">Outcome</span>
                <span className="value">{viewItem.outcome || "—"}</span>
              </div>
              <div className="preview-item full-width">
                <span className="label">Samples Requested</span>
                <span className="value">{viewItem.samples_requested || "—"}</span>
              </div>
            </div>
            <div className="btn-group" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-secondary" onClick={() => setViewItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
