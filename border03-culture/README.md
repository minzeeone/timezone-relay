# BorderBridge | Border 03 Culture AI

A Streamlit hackathon demo for finding workplace misunderstanding risk across cultural contexts. It presents **surface meaning, likely intent, misunderstanding points, recommended wording, and next actions** on one screen.

## Run it

Use Python 3.10 or later.

### Everyday use (no PowerShell)

After the one-time setup below, double-click **`Start BorderBridge.vbs`**. It starts the local app in the background and opens it at `http://localhost:8501` without displaying PowerShell or another terminal.

`Start BorderBridge.bat` is also available if you prefer to see a small terminal window while the app starts.

### One-time setup

```bash
pip install -r requirements.txt
streamlit run app.py
```

Open the displayed local URL (normally `http://localhost:8501`).

## Demo mode and live AI mode

Without an API key the app automatically runs in **Demo mode**. It includes a featured Korean indirect-expression scenario and a general message analyzer, so the demo works without any account setup.

For live OpenAI analysis, copy `.env.example` to `.env` and set the key:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
```

Do not commit `.env`. If a live request fails, the app shows a notice and falls back to Demo mode.

## Suggested pitch flow

1. Click **Load featured Korean example**.
2. Click **Analyze cultural intent**.
3. Explain that BorderBridge is not a translation tool: it surfaces a possible schedule risk that a polite, indirect phrase can hide.
4. Show the recommended wording and immediate actions to demonstrate that the insight leads to a concrete collaboration decision.

## Implementation notes

- Live mode uses the OpenAI Responses API with Structured Outputs (JSON Schema), providing predictable fields for the UI.
- Cultural context is not a personality label. Results are clearly framed as hypotheses to be validated through conversation.

## JavaScript prompt module

`culture_analysis_prompt.mjs` contains only the Culture AI instructions, input builder, and JSON schema. A JavaScript team can import `createCultureAnalysisRequest()` into its server-side OpenAI route and spread the returned object into `openai.responses.create()`.
