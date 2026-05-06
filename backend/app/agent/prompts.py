"""
Prompt templates for the LangGraph HCP CRM agent.
All prompts instruct the LLM to return parseable JSON.
"""

INTENT_CLASSIFICATION_PROMPT = """You are a life-science CRM AI assistant. Classify the user's intent into exactly ONE of the following categories:

- log_interaction: The user wants to log or record a new HCP interaction.
- edit_interaction: The user wants to modify or update an existing interaction.
- fetch_hcp_profile: The user wants to view an HCP's profile or history.
- suggest_next_best_action: The user wants advice on next steps for an HCP.
- compliance_check: The user wants to check notes for compliance issues.
- general_help: Any other question or greeting.

User message: "{message}"

Respond with ONLY a JSON object:
{{"intent": "<one of the above categories>"}}
"""

INTERACTION_EXTRACTION_PROMPT = """You are a life-science CRM AI assistant. Extract interaction details from the user's message.

User message: "{message}"

Extract as many fields as you can from the message. Return ONLY a JSON object with these keys (use null for fields not mentioned):
{{
  "hcp_name": "string or null",
  "specialty": "string or null",
  "organization": "string or null",
  "interaction_type": "In-person visit | Phone call | Email | Conference meeting | Virtual meeting or null",
  "interaction_date": "string date or null",
  "products_discussed": "string or null",
  "notes": "string or null",
  "sentiment": "Positive | Neutral | Negative or null",
  "outcome": "string or null",
  "follow_up_required": true/false or null,
  "follow_up_date": "string date or null",
  "samples_requested": "string or null"
}}
"""

SUMMARY_GENERATION_PROMPT = """You are a life-science CRM AI assistant. Write a concise professional summary of this HCP interaction.

Interaction details:
{details}

Return ONLY a JSON object:
{{"summary": "your concise summary here"}}
"""

COMPLIANCE_CHECK_PROMPT = """You are a pharmaceutical compliance officer AI. Analyze the following notes for regulatory compliance issues.

Notes: "{notes}"

Check for:
- Guaranteed cure or improvement claims
- Off-label use promotion
- Unapproved pricing claims
- Exaggerated efficacy statements
- Unsafe promises

Return ONLY a JSON object:
{{
  "is_compliant": true or false,
  "risk_level": "low" | "medium" | "high",
  "flagged_phrases": ["list of problematic phrases"],
  "safer_rewrite": "a compliant version of the notes or null if already compliant"
}}
"""

NEXT_BEST_ACTION_PROMPT = """You are a life-science CRM AI assistant advising a field representative. Based on the following interaction context, suggest the best next actions.

Context:
{context}

Consider actions like:
- Send clinical trial data
- Schedule a follow-up meeting
- Share approved marketing brochure
- Escalate to Medical Science Liaison
- Send product samples
- Arrange peer-to-peer speaker program
- Mark as low priority

Return ONLY a JSON object:
{{
  "suggested_actions": ["action 1", "action 2", "action 3"],
  "reasoning": "brief explanation of why these actions are recommended"
}}
"""

EDIT_EXTRACTION_PROMPT = """You are a life-science CRM AI assistant. The user wants to edit an existing interaction. Extract the fields they want to change.

User message: "{message}"

Return ONLY a JSON object with only the fields the user explicitly wants to change:
{{
  "hcp_name": "string or omit",
  "specialty": "string or omit",
  "organization": "string or omit",
  "interaction_type": "string or omit",
  "products_discussed": "string or omit",
  "notes": "string or omit",
  "sentiment": "Positive | Neutral | Negative or omit",
  "outcome": "string or omit",
  "follow_up_required": true/false or omit,
  "follow_up_date": "string or omit",
  "samples_requested": "string or omit"
}}

Only include keys the user explicitly mentioned changing. Do not include unchanged fields.
"""

HCP_PROFILE_SEARCH_PROMPT = """You are a life-science CRM AI assistant. Extract the HCP name the user is asking about.

User message: "{message}"

Return ONLY a JSON object:
{{"hcp_name": "the doctor's name"}}
"""
