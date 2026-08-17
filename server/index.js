import dotenv from 'dotenv';
import express from 'express';
import OpenAI from 'openai';
import { fileURLToPath } from 'node:url';

import { run as runBorder04 } from './borders/border04-org.js';
import { collectProjectLogs } from './data/projectLogs.js';

dotenv.config({
  path: fileURLToPath(new URL('../.env', import.meta.url)),
});

const PORT = Number(process.env.PORT || 3001);
const MODEL = process.env.OPENAI_LOCALIZATION_MODEL || 'gpt-5-nano';

const localizationResultSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['original', 'localizedText', 'changes', 'culturalNote'],
  properties: {
    original: { type: 'string' },
    localizedText: { type: 'string' },
    changes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['original', 'localized', 'type', 'reason'],
        properties: {
          original: { type: 'string' },
          localized: { type: 'string' },
          type: {
            type: 'string',
            enum: ['term', 'acronym', 'culture', 'naturalization'],
          },
          reason: { type: 'string' },
        },
      },
    },
    culturalNote: { type: 'string' },
  },
};

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error('OPENAI_API_KEY environment variable is not set.');
    error.statusCode = 500;
    throw error;
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return 'Request body is required.';
  }

  if (typeof payload.message !== 'string' || !payload.message.trim()) {
    return '`message` must be a non-empty string.';
  }

  if (typeof payload.sourceLanguage !== 'string' || !payload.sourceLanguage) {
    return '`sourceLanguage` must be provided.';
  }

  if (typeof payload.targetLanguage !== 'string' || !payload.targetLanguage) {
    return '`targetLanguage` must be provided.';
  }

  if (payload.recipient !== undefined && (typeof payload.recipient !== 'object' || payload.recipient === null)) {
    return '`recipient` must be an object when provided.';
  }

  if (payload.glossary !== undefined && !Array.isArray(payload.glossary)) {
    return '`glossary` must be an array when provided.';
  }

  return null;
}

function buildLocalizationPrompt(payload) {
  return [
    'You are the AI localization engine for APEX, a global collaboration messenger.',
    'Localize the message. Do not merely translate it literally.',
    '',
    'Rules:',
    '- Adapt the message to the target language.',
    '- Make the wording natural for the recipient country, role, and team.',
    '- Preserve company terms, project names, and product names when glossary rule is "preserve".',
    '- Preserve technical acronyms such as CI/CD and IAM when glossary rule is "preserve".',
    '- Convert Korean workplace phrases into natural local workplace phrasing.',
    '- Explain every meaningful change in the changes array.',
    '- localizedText must be written in the targetLanguage.',
    '- changes[].reason must be written in Korean for the Korean sender UI.',
    '- culturalNote must be written in Korean for the Korean sender UI.',
    '- Keep changes[].original and changes[].localized in the natural languages of the before/after phrase.',
    '- Keep the original meaning, urgency, and business risk level intact.',
    '- Do not add facts that are not present in the message.',
    '',
    `Request payload:\n${JSON.stringify(payload, null, 2)}`,
  ].join('\n');
}

function extractOutputText(response) {
  if (typeof response.output_text === 'string') {
    return response.output_text;
  }

  const parts = [];

  for (const output of response.output ?? []) {
    for (const content of output.content ?? []) {
      if (typeof content.text === 'string') {
        parts.push(content.text);
      }
    }
  }

  return parts.join('');
}

function parseLocalizationResult(response) {
  const outputText = extractOutputText(response);

  if (!outputText) {
    const error = new Error('OpenAI response did not contain output text.');
    error.statusCode = 502;
    throw error;
  }

  try {
    return JSON.parse(outputText);
  } catch {
    const error = new Error('OpenAI response was not valid LocalizationResult JSON.');
    error.statusCode = 502;
    throw error;
  }
}

function assertLocalizationResult(result) {
  const validChangeTypes = new Set(['term', 'acronym', 'culture', 'naturalization']);

  if (!result || typeof result !== 'object') return false;
  if (typeof result.original !== 'string') return false;
  if (typeof result.localizedText !== 'string') return false;
  if (!Array.isArray(result.changes)) return false;
  if (typeof result.culturalNote !== 'string') return false;

  return result.changes.every(
    (change) =>
      change &&
      typeof change.original === 'string' &&
      typeof change.localized === 'string' &&
      validChangeTypes.has(change.type) &&
      typeof change.reason === 'string'
  );
}

async function localizeMessage(payload) {
  const openai = getOpenAIClient();

  let response;

  try {
    response = await openai.responses.create({
      model: MODEL,
      store: false,
      input: [
        {
          role: 'system',
          content: [
          {
            type: 'input_text',
            text: 'Return only structured JSON that matches the requested localization schema. The localized message should use the target language, but all explanation fields shown to the sender must be Korean.',
          },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: buildLocalizationPrompt(payload),
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'localization_result',
          description: 'A localized collaboration message with explanations for each localization change.',
          strict: true,
          schema: localizationResultSchema,
        },
      },
    });
  } catch (error) {
    if (error.status) {
      throw error;
    }

    const connectionError = new Error(
      'OpenAI API 연결에 실패했습니다. 인터넷 연결, 방화벽/VPN/프록시, 또는 api.openai.com 접근 가능 여부를 확인해주세요.'
    );
    connectionError.statusCode = 502;
    connectionError.cause = error;
    throw connectionError;
  }

  const result = parseLocalizationResult(response);

  if (!assertLocalizationResult(result)) {
    const error = new Error('OpenAI response did not match LocalizationResult.');
    error.statusCode = 502;
    throw error;
  }

  return {
    ...result,
    original: payload.message.trim(),
  };
}

const app = express();

app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/openai-status', async (req, res) => {
  try {
    const openai = getOpenAIClient();
    const models = await openai.models.list();

    res.json({
      ok: true,
      model: MODEL,
      modelCount: models.data?.length ?? 0,
    });
  } catch (error) {
    res.status(error.statusCode || error.status || 502).json({
      ok: false,
      error: error.message || 'OpenAI status check failed.',
      code: error.code,
      type: error.type,
    });
  }
});

app.post('/api/localize', async (req, res) => {
  try {
    const validationError = validatePayload(req.body);

    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    const result = await localizeMessage(req.body);
    res.json(result);
  } catch (error) {
    const statusCode = error.statusCode || error.status || 500;
    console.error('Localization API error:', {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
      cause: error.cause?.message,
    });
    res.status(statusCode >= 500 ? 500 : statusCode).json({
      error: error.message || 'Localization failed.',
      code: error.code,
      type: error.type,
    });
  }
});

/**
 * Border 04 (조직) — 인수인계 브리핑 생성.
 *
 * ShiftEndModal 의 "생성 중..." 단계에서 호출됩니다.
 * 프로젝트별 수집 로그 + 사용자가 추가로 남긴 전달사항을 함께 넣어,
 * 중복 제거 / 결정사항 / 작업사항 / 지난 브리핑 대비 변경점을 만들어 돌려줍니다.
 */
app.post('/api/handoff/generate', async (req, res) => {
  try {
    const { project, additionalNote, recipient } = req.body ?? {};

    if (typeof project !== 'string' || !project.trim()) {
      res.status(400).json({ error: '`project` must be a non-empty string.' });
      return;
    }

    const collected = collectProjectLogs(project.trim());
    const note = typeof additionalNote === 'string' ? additionalNote.trim() : '';
    const logText = note
      ? `${collected}\n[추가 전달사항 — ${recipient || '인수자'}에게] ${note}`
      : collected;

    const briefing = await runBorder04({ logText, projectId: project.trim() });
    res.json(briefing);
  } catch (error) {
    console.error('Handoff API error:', error);
    res.status(error.status || 500).json({
      error: error.message || '인수인계 브리핑 생성에 실패했습니다.',
    });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Request body must be valid JSON.' });
    return;
  }

  next(err);
});

app.listen(PORT, () => {
  console.log(`APEX server listening on http://127.0.0.1:${PORT}`);
  console.log(`  Border 02 언어  : ${process.env.OPENAI_API_KEY ? 'OpenAI 연결됨' : '키 없음 (오류 반환)'}`);
  console.log(`  Border 04 조직  : ${process.env.ANTHROPIC_API_KEY ? 'Claude 연결됨' : '데모 모드'}`);
});
