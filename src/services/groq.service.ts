const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.1-8b-instant'

async function groqComplete(
  messages: { role: 'system' | 'user'; content: string }[],
  jsonMode = false
): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0,
      ...(jsonMode && { response_format: { type: 'json_object' } }),
    }),
  })
  if (!res.ok) throw new Error(`Groq error: ${res.status}`)
  const data = await res.json()
  return data.choices[0].message.content as string
}

export async function cleanBulkNames(rawText: string): Promise<string[]> {
  const text = await groqComplete([
    {
      role: 'system',
      content:
        'Extract only the person names from the input text. Remove line numbers, bullets, song counts, phone numbers, emails, or any non-name content. Return one clean full name per line, nothing else. No headers, no explanations.',
    },
    { role: 'user', content: rawText },
  ])
  return text.split('\n').map((n) => n.trim()).filter(Boolean)
}

export interface ParsedAttendee {
  memberId: string
  memberName: string
  songCount: number
}

export async function parseBulkAttendees(
  rawText: string,
  members: { id: string; name: string }[]
): Promise<{ matched: ParsedAttendee[]; unmatched: string[] }> {
  const membersList = members.map((m) => `${m.id}|||${m.name}`).join('\n')

  const content = await groqComplete(
    [
      {
        role: 'system',
        content: `You are a data extractor. Match each singer in the input to a known member and extract their song count.

Known members (format: id|||name):
${membersList}

Return ONLY a JSON object:
{
  "matched": [{"memberId": "<id>", "memberName": "<name>", "songCount": <number>}],
  "unmatched": ["<original line that could not be matched>"]
}

Rules:
- Match names flexibly (partial/first name if unambiguous)
- Default song count to 1 if not given
- If a name could match multiple members, put it in unmatched
- memberId and memberName must come exactly from the known members list`,
      },
      { role: 'user', content: rawText },
    ],
    true
  )

  const parsed = JSON.parse(content)
  return {
    matched: Array.isArray(parsed.matched) ? parsed.matched : [],
    unmatched: Array.isArray(parsed.unmatched) ? parsed.unmatched : [],
  }
}
