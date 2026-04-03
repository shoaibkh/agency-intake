type AiOutput = {
  extractedFeatures: string[];
  category: 'Web App' | 'Mobile' | 'AI/ML' | 'Automation' | 'Integration';
  effortMinHours: number;
  effortMaxHours: number;
  suggestedStack: string[];
  complexityScore: number;
  summary: string;
};

function fallbackAnalyze(description: string): AiOutput {
  const words = description.split(/\s+/).length;
  const complexityScore = Math.min(5, Math.max(1, Math.round(words / 120) || 1));
  return {
    extractedFeatures: [
      'User authentication',
      'Admin dashboard',
      'Data storage',
      'Notifications'
    ].slice(0, Math.max(2, Math.min(4, Math.ceil(words / 80)))),
    category: words > 160 ? 'Web App' : 'Automation',
    effortMinHours: Math.max(24, words * 0.8),
    effortMaxHours: Math.max(48, words * 1.4),
    suggestedStack: ['Next.js', 'PostgreSQL', 'Prisma', 'Redis'],
    complexityScore,
    summary: 'AI generated estimate based on the incoming brief description.'
  };
}

export async function analyzeBrief(description: string): Promise<AiOutput> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return fallbackAnalyze(description);

  const baseUrl = process.env.AI_API_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  const prompt = `
You are a senior solution architect for a digital agency.
Return strict JSON with keys:
extractedFeatures (array of strings),
category (one of: Web App, Mobile, AI/ML, Automation, Integration),
effortMinHours (number),
effortMaxHours (number),
suggestedStack (array of strings),
complexityScore (integer 1-5),
summary (string).

Brief:
${description}
`;

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You output only strict JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    })
  });

  console.log('AI response status:', response);

  if (!response.ok) {
    console.error('AI response error:');
    return fallbackAnalyze(description);
  }

  const data = await response.json() as any;
  const content = data?.choices?.[0]?.message?.content ?? '';
  try {
    const parsed = JSON.parse(content);
    return {
      extractedFeatures: Array.isArray(parsed.extractedFeatures) ? parsed.extractedFeatures : [],
      category: parsed.category ?? 'Web App',
      effortMinHours: Number(parsed.effortMinHours ?? 24),
      effortMaxHours: Number(parsed.effortMaxHours ?? 48),
      suggestedStack: Array.isArray(parsed.suggestedStack) ? parsed.suggestedStack : ['Next.js', 'Prisma'],
      complexityScore: Math.max(1, Math.min(5, Number(parsed.complexityScore ?? 3))),
      summary: String(parsed.summary ?? 'AI analysis generated.')
    };
  } catch {
    return fallbackAnalyze(description);
  }
}
