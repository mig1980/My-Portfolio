/**
 * @fileoverview Test script to check Gemini model availability.
 * Run with: npx tsx scripts/test-gemini-models.ts YOUR_API_KEY
 */

const MODELS_TO_TEST = [
  'gemini-3-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemma-3-27b-it',
  // Also test known working models
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];

interface TestResult {
  model: string;
  status: 'success' | 'error';
  httpStatus?: number;
  message?: string;
  responseTime?: number;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
}

async function testModel(apiKey: string, modelName: string): Promise<TestResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: 'Say "Hello" and nothing else.' }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 10,
    },
  };

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;
    const data = (await response.json()) as GeminiResponse;

    if (response.ok) {
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No text';
      return {
        model: modelName,
        status: 'success',
        httpStatus: response.status,
        message: `Response: "${text.trim()}"`,
        responseTime,
      };
    } else {
      return {
        model: modelName,
        status: 'error',
        httpStatus: response.status,
        message: data.error?.message || JSON.stringify(data.error),
        responseTime,
      };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      model: modelName,
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const apiKey = process.argv[2];

  if (!apiKey) {
    console.error('Usage: npx tsx scripts/test-gemini-models.ts YOUR_GEMINI_API_KEY');
    process.exit(1);
  }

  console.log('Testing Gemini models...\n');
  console.log('='.repeat(80));

  const results: TestResult[] = [];

  for (const model of MODELS_TO_TEST) {
    process.stdout.write(`Testing ${model}... `);
    const result = await testModel(apiKey, model);
    results.push(result);

    if (result.status === 'success') {
      console.log(`✅ ${result.httpStatus} (${result.responseTime}ms) - ${result.message}`);
    } else {
      console.log(`❌ ${result.httpStatus || 'N/A'} - ${result.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\nSUMMARY:');
  console.log('-'.repeat(40));

  const working = results.filter((r) => r.status === 'success');
  const failed = results.filter((r) => r.status === 'error');

  console.log(`\n✅ Working models (${working.length}):`);
  working.forEach((r) => console.log(`   - ${r.model}`));

  console.log(`\n❌ Failed models (${failed.length}):`);
  failed.forEach((r) => console.log(`   - ${r.model}: ${r.message?.substring(0, 60)}...`));

  console.log('\n' + '='.repeat(80));
  console.log('\nRecommended MODEL_CHAIN for functions/api/chat.ts:');
  console.log('const MODEL_CHAIN = [');
  working.forEach((r) => console.log(`  '${r.model}',`));
  console.log('];');
}

main().catch(console.error);
