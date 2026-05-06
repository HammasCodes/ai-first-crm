import { useDispatch, useSelector } from "react-redux";
import { invokeTool, addUserMessage } from "../features/chatSlice";
import { FaPen, FaEdit, FaUser, FaBullseye, FaShieldAlt, FaWrench } from "react-icons/fa";

const TOOLS = [
  {
    id: "log-interaction",
    name: "Log Interaction",
    icon: <FaPen />,
    description: "Capture a new HCP interaction from natural language.",
    example: "I met Dr. Sharma at City Care Hospital today. We discussed CardioMax. He seemed interested but asked for more clinical trial data. Follow up next Friday.",
  },
  {
    id: "edit-interaction",
    name: "Edit Interaction",
    icon: <FaEdit />,
    description: "Modify an existing interaction's fields.",
    example: "Change the sentiment to neutral and add that he asked for pricing details.",
  },
  {
    id: "fetch-hcp",
    name: "Fetch HCP Profile",
    icon: <FaUser />,
    description: "Retrieve an HCP's profile and interaction history.",
    example: "Show me Dr. Sharma's profile.",
  },
  {
    id: "next-best-action",
    name: "Suggest Next Best Action",
    icon: <FaBullseye />,
    description: "Get AI-suggested next steps for a field rep.",
    example: "What should I do next for this doctor?",
  },
  {
    id: "compliance-check",
    name: "Compliance Check",
    icon: <FaShieldAlt />,
    description: "Check notes for risky or non-compliant language.",
    example: "Check this note: I promised guaranteed improvement with CardioMax.",
  },
];

export default function ToolDemoPanel() {
  const dispatch = useDispatch();
  const { loading } = useSelector((s) => s.chat);

  const handleToolClick = (tool) => {
    dispatch(addUserMessage(`[Tool Demo] ${tool.name}: "${tool.example}"`));
    dispatch(invokeTool({ tool: tool.id, message: tool.example }));
  };

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <div className="card-header">
        <h2><span className="icon"><FaWrench /></span> LangGraph Tool Demo</h2>
      </div>
      <div className="card-body">
        <p style={{ fontSize: "0.82rem", color: "var(--gray-500)", marginBottom: 16 }}>
          Click any tool below to trigger it with the sample input. Results appear in the chat panel.
        </p>
        <div className="tool-grid">
          {TOOLS.map((tool) => (
            <div
              key={tool.id}
              className="tool-card"
              onClick={() => !loading && handleToolClick(tool)}
              style={loading ? { opacity: 0.6, pointerEvents: "none" } : {}}
            >
              <h4><span style={{ marginRight: "8px" }}>{tool.icon}</span> {tool.name}</h4>
              <p>{tool.description}</p>
              <div className="example">&quot;{tool.example}&quot;</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
