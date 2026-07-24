import { Container, PageHeader, Card, CardHeader, CardTitle, CardContent, EmptyState } from '@ahi/ui';
import { createSdk } from '@ahi/sdk';
import type { AIModel } from '@ahi/shared';

export const dynamic = 'force-dynamic';

async function getModels(): Promise<AIModel[]> {
  const sdk = createSdk();
  try {
    return await sdk.ai.listModels();
  } catch {
    return [];
  }
}

export default async function AiPage() {
  const models = await getModels();

  return (
    <Container size="lg">
      <PageHeader
        title="AI"
        description="Available AI models across providers."
      />
      {models.length === 0 ? (
        <EmptyState
          title="No models available"
          description="Configure at least one AI provider (OpenAI, Gemini, or Ollama) to see models."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {models.map((model) => (
            <Card key={`${model.provider}-${model.id}`}>
              <CardHeader>
                <CardTitle>{model.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Provider</dt>
                    <dd className="font-medium text-neutral-900">{model.provider}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Context Window</dt>
                    <dd className="font-medium text-neutral-900">
                      {model.contextWindow.toLocaleString()}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Streaming</dt>
                    <dd className="font-medium text-neutral-900">
                      {model.supportsStreaming ? 'Yes' : 'No'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Tool Calls</dt>
                    <dd className="font-medium text-neutral-900">
                      {model.supportsToolCalls ? 'Yes' : 'No'}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}
