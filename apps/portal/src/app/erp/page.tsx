import { Container, PageHeader, Card, CardContent, Badge, EmptyState } from '@ahi/ui';
import { createSdk } from '@ahi/sdk';
import type { ERPSyncStatus } from '@ahi/shared';

export const dynamic = 'force-dynamic';

async function getSyncStatuses(): Promise<ERPSyncStatus[]> {
  const sdk = createSdk();
  const systems = ['erpnext', 'internal'];
  const results = await Promise.allSettled(
    systems.map((s) => sdk.erp.getSyncStatus(s)),
  );
  return results
    .filter((r): r is PromiseFulfilledResult<ERPSyncStatus> => r.status === 'fulfilled')
    .map((r) => r.value);
}

export default async function ErpPage() {
  const syncStatuses = await getSyncStatuses();

  return (
    <Container size="lg">
      <PageHeader
        title="ERP"
        description="ERP data aggregation and sync status across connected systems."
      />
      {syncStatuses.length === 0 ? (
        <EmptyState
          title="No ERP systems connected"
          description="Configure an ERP system (e.g. ERPNext) to view sync status."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {syncStatuses.map((status) => (
            <Card key={status.system}>
              <CardContent className="pt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold capitalize text-neutral-900">
                    {status.system}
                  </h3>
                  <Badge
                    variant={
                      status.status === 'idle'
                        ? 'neutral'
                        : status.status === 'syncing'
                          ? 'primary'
                          : 'error'
                    }
                  >
                    {status.status}
                  </Badge>
                </div>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Last Sync</dt>
                    <dd className="font-medium text-neutral-900">
                      {status.lastSyncAt ?? 'Never'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Records Processed</dt>
                    <dd className="font-medium text-neutral-900">
                      {status.recordsProcessed.toLocaleString()}
                    </dd>
                  </div>
                  {status.errorMessage && (
                    <div className="mt-2 rounded-md bg-error-50 p-2 text-sm text-error-700">
                      {status.errorMessage}
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}
