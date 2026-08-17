# -*- coding: utf-8 -*-
import json
import os
import re
from typing import Any

import streamlit as st
from dotenv import load_dotenv

load_dotenv()
st.set_page_config(page_title="BorderBridge | Culture AI", page_icon="BB", layout="wide")

# Unicode escapes keep this source file portable in Windows terminals with legacy encodings.
K_DIFFICULT = "\uc5b4\ub824\uc6b8"
K_CONFIRM = "\ud655\uc778"
K_SPEAK = "\ub9d0\uc500"
K_HIGH = "\ub192\uc74c"
K_MEDIUM = "\ubcf4\ud1b5"
K_LOW = "\ub0ae\uc74c"

FEATURED_RESULT = {
    "risk_level": K_HIGH,
    "risk_score": 82,
    "surface_meaning": "The sender says the schedule may be difficult and will check internally before responding.",
    "likely_intent": "The current request or schedule is likely not feasible as-is. The sender is avoiding a final answer while assessing alternatives.",
    "misunderstanding_points": [
        "A receiver may mistake this for a minor concern or routine check rather than a schedule risk.",
        "The possibility of rejecting or changing the plan is not stated directly.",
    ],
    "recommended_expression": "The current timeline may not be feasible due to a technical constraint. We will confirm the impact by tomorrow 2 PM KST and propose options.",
    "next_actions": [
        "State the constraint and its impact explicitly.",
        "Commit to a specific time for the next update.",
        "Offer options for scope, timeline, or staffing where possible.",
    ],
}


def generic_demo(message: str, sender: str, receiver: str, context: str) -> dict[str, Any]:
    lowered = message.lower()
    hedges = [K_DIFFICULT, K_CONFIRM, "maybe", "might", "try", "consider", "review"]
    elevated = any(word in lowered for word in hedges)
    return {
        "risk_level": K_HIGH if elevated else K_MEDIUM,
        "risk_score": 72 if elevated else 38,
        "surface_meaning": f"Direct reading of the message in the {context} context: {message}",
        "likely_intent": (
            "There may be an unstated concern about feasibility, priority, or timing. Treat this as a hypothesis and confirm the decision needed and its deadline."
            if elevated else "The sender appears to be sharing information or seeking alignment. Clarify the expected next step and owner."
        ),
        "misunderstanding_points": [
            f"Expectations about directness can differ between {sender} and {receiver}.",
            "Do not treat an inferred intention as fact; validate it with a clarifying question.",
        ],
        "recommended_expression": "To make sure we are aligned: here is the current constraint, its impact, and the next update time. Could we confirm the owner and deadline?",
        "next_actions": [
            "Separate current status, blocker, and impact into clear sentences.",
            "Ask one focused question that needs confirmation.",
            "Agree on the next update time and responsible person.",
        ],
    }


def demo_analysis(message: str, sender: str, receiver: str, context: str) -> dict[str, Any]:
    normalized = re.sub(r"\s+", " ", message.strip())
    if all(token in normalized for token in (K_DIFFICULT, K_CONFIRM, K_SPEAK)):
        return FEATURED_RESULT
    return generic_demo(message, sender, receiver, context)


SCHEMA = {
    "type": "object",
    "properties": {
        "risk_level": {"type": "string", "enum": [K_LOW, K_MEDIUM, K_HIGH]},
        "risk_score": {"type": "integer", "minimum": 0, "maximum": 100},
        "surface_meaning": {"type": "string"},
        "likely_intent": {"type": "string"},
        "misunderstanding_points": {"type": "array", "items": {"type": "string"}},
        "recommended_expression": {"type": "string"},
        "next_actions": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["risk_level", "risk_score", "surface_meaning", "likely_intent", "misunderstanding_points", "recommended_expression", "next_actions"],
    "additionalProperties": False,
}


def ai_analysis_with_key(message: str, sender: str, receiver: str, context: str, api_key: str) -> dict[str, Any]:
    from openai import OpenAI

    instructions = """You are BorderBridge, an intercultural workplace communication assistant.
Analyze the message as a hypothesis, never a fact. Avoid stereotypes: cultures are contexts, not deterministic rules.
Write all result fields in Korean. Give concise, useful workplace advice. Recommend wording in the receiver's likely working language. Return only the requested schema."""
    prompt = f"Sender cultural context: {sender}\nReceiver cultural context: {receiver}\nWork context: {context}\nMessage: {message}"
    
    client = OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        messages=[
            {"role": "system", "content": instructions},
            {"role": "user", "content": prompt}
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "culture_analysis",
                "strict": True,
                "schema": SCHEMA
            }
        }
    )
    return json.loads(response.choices[0].message.content)


def analyze(message: str, sender: str, receiver: str, context: str) -> tuple[dict[str, Any], str]:
    api_key = ""
    
    if not api_key:
        return demo_analysis(message, sender, receiver, context), "Demo mode"
    try:
        return ai_analysis_with_key(message, sender, receiver, context, api_key), "OpenAI live analysis"
    except Exception as error:
        st.warning(f"Live analysis was unavailable, so the demo engine was used. ({error})")
        return demo_analysis(message, sender, receiver, context), "Demo mode (live fallback)"

def show_list(items: list[str]) -> None:
    for item in items:
        st.markdown(f"- {item}")


st.markdown("""<style>
.block-container {max-width: 1180px; padding-top: 2rem; padding-bottom: 3rem;}
.hero {padding: 1.5rem 1.7rem; border-radius: 18px; color: white; background: linear-gradient(115deg, #173b71, #6b48a8); margin-bottom: 1.4rem;}
.hero h1 {margin: 0; font-size: 2.2rem;} .hero p {margin: .4rem 0 0; opacity: .9;}
.panel {border: 1px solid #e7e9ef; border-radius: 14px; padding: 1rem 1.1rem; min-height: 170px; background: white;}
.label {font-size: .82rem; color: #666; font-weight: 700; letter-spacing: .03em; text-transform: uppercase;}
</style>""", unsafe_allow_html=True)
st.markdown("""<div class="hero"><h1>BorderBridge | Culture AI</h1><p>Go beyond translation: identify cultural context, alignment risks, and the next action.</p></div>""", unsafe_allow_html=True)

with st.sidebar:
    st.header("Demo settings")
    st.success("Live AI mode")
    st.caption("Running with direct API key.")
    if st.button("Load featured Korean example", use_container_width=True):
        st.session_state.message = "\uc77c\uc815\uc0c1 \uc870\uae08 \uc5b4\ub824\uc6b8 \uac83 \uac19\uc544\uc694. \ub0b4\ubd80\uc801\uc73c\ub85c \ub2e4\uc2dc \ud655\uc778\ud574\ubcf4\uace0 \ub9d0\uc500\ub4dc\ub9b4\uac8c\uc694."
        st.session_state.sender = "Korea"
        st.session_state.receiver = "United States"
        st.session_state.context = "Project timeline"

st.subheader("1. Message context")
left, right = st.columns([1.45, 1])
with left:
    message = st.text_area("Work message to analyze", key="message", height=155, placeholder="Paste a message in any language...")
with right:
    cultures = ["Korea", "United States", "Japan", "Germany", "India", "Other"]
    sender = st.selectbox("Sender cultural context", cultures, key="sender")
    receiver = st.selectbox("Receiver cultural context", cultures, index=1, key="receiver")
    context = st.selectbox("Work situation", ["Project timeline", "Technical review", "Feedback / review", "Negotiation / decision", "Customer communication"], key="context")

run = st.button("Analyze cultural intent", type="primary", use_container_width=True, disabled=not bool(message.strip()))
if run:
    with st.spinner("Analyzing surface meaning, implied intent, and communication risk..."):
        st.session_state.result, st.session_state.mode = analyze(message, sender, receiver, context)

if "result" not in st.session_state:
    st.info("Enter a message, or load the featured Korean example to begin.")
else:
    result = st.session_state.result
    st.divider()
    st.subheader("2. Culture AI result")
    st.caption(f"Analysis mode: {st.session_state.mode}. This is a workplace hypothesis, not a statement of personal intent.")
    icon = {K_HIGH: "HIGH", K_MEDIUM: "MEDIUM", K_LOW: "LOW"}.get(result["risk_level"], "N/A")
    c1, c2, c3 = st.columns(3)
    c1.metric("Misunderstanding risk", f"{icon} ({result['risk_level']})")
    c2.metric("Risk score", f"{result['risk_score']} / 100")
    c3.metric("Work situation", context)
    a, b = st.columns(2)
    with a:
        st.markdown('<div class="panel"><div class="label">Surface meaning</div>', unsafe_allow_html=True)
        st.write(result["surface_meaning"])
        st.markdown("</div>", unsafe_allow_html=True)
    with b:
        st.markdown('<div class="panel"><div class="label">Likely intent</div>', unsafe_allow_html=True)
        st.write(result["likely_intent"])
        st.markdown("</div>", unsafe_allow_html=True)
    c, d = st.columns(2)
    with c:
        st.markdown('<div class="panel"><div class="label">Misunderstanding points</div>', unsafe_allow_html=True)
        show_list(result["misunderstanding_points"])
        st.markdown("</div>", unsafe_allow_html=True)
    with d:
        st.markdown('<div class="panel"><div class="label">Recommended wording</div>', unsafe_allow_html=True)
        st.code(result["recommended_expression"], language=None)
        st.markdown("</div>", unsafe_allow_html=True)
    st.markdown("#### What to do now")
    show_list(result["next_actions"])

st.divider()
st.caption("BorderBridge does not reduce people to cultures. It uses cultural context to help teams start clearer conversations.")
