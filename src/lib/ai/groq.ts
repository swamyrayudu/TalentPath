import 'server-only';

/**
 * Minimal Groq client. Groq speaks the OpenAI chat-completions shape, so a plain
 * fetch is enough — no SDK, no extra dependency.
 *
 * The gpt-oss models are reasoning models, but Groq returns their chain of
 * thought in a separate `reasoning` field rather than inside `content`, so JSON
 * mode stays clean. (Contrast with Gemini, where reasoning eats the output
 * budget and truncates silently.)
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const GROQ_MODEL = 'openai/gpt-oss-120b';

export class GroqError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'GroqError';
  }
}

export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

interface ChatOptions {
  system: string;
  user: string;
  /** Ask for a JSON object back and parse it. */
  json?: boolean;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** gpt-oss only. 'low' keeps latency near 400ms. */
  reasoningEffort?: 'low' | 'medium' | 'high';
  signal?: AbortSignal;
}

interface GroqResponse {
  choices?: { message?: { content?: string }; finish_reason?: string }[];
  error?: { message?: string };
}

export async function groqChat(options: ChatOptions): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new GroqError('GROQ_API_KEY is not configured');

  const {
    system,
    user,
    json = false,
    model = GROQ_MODEL,
    temperature = 0.2,
    maxTokens = 4096,
    reasoningEffort = 'low',
    signal,
  } = options;

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature,
      max_completion_tokens: maxTokens,
      reasoning_effort: reasoningEffort,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }),
    signal,
  });

  const data = (await response.json().catch(() => null)) as GroqResponse | null;

  if (!response.ok) {
    throw new GroqError(data?.error?.message || `Groq returned ${response.status}`, response.status);
  }

  const choice = data?.choices?.[0];
  const content = choice?.message?.content?.trim();
  if (!content) throw new GroqError('Groq returned an empty response');
  if (choice?.finish_reason === 'length') {
    throw new GroqError('Groq response was cut off before it finished');
  }

  return content;
}

/** Chat that must come back as JSON. Throws if the model returns anything else. */
export async function groqJson<T>(options: Omit<ChatOptions, 'json'>): Promise<T> {
  const raw = await groqChat({ ...options, json: true });
  try {
    return JSON.parse(raw) as T;
  } catch {
    // JSON mode makes this rare, but a stray fence should not lose the whole run.
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        /* fall through */
      }
    }
    throw new GroqError('Groq did not return valid JSON');
  }
}
