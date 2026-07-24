import { Container, PageHeader, Card, CardContent, Badge, EmptyState } from '@ahi/ui';
import { createSdk } from '@ahi/sdk';
import type { Organization } from '@ahi/shared';

export const dynamic = 'force-dynamic';

async function getOrganizations(): Promise<Organization[]> {
  const sdk = createSdk();
  try {
    const response = await sdk.organizations.list({ page: 1, pageSize: 50 });
    return response.data;
  } catch {
    return [];
  }
}

export default async function OrganizationsPage() {
  const organizations = await getOrganizations();

  return (
    <Container size="lg">
      <PageHeader
        title="Organizations"
        description="View and manage organizations in the AHI system."
      />
      {organizations.length === 0 ? (
        <EmptyState
          title="No organizations found"
          description="Organizations will appear here once the organization service is running."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Card key={org.id}>
              <CardContent className="pt-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-neutral-900">{org.name}</h3>
                  <Badge
                    variant={
                      org.status === 'active'
                        ? 'success'
                        : org.status === 'suspended'
                          ? 'warning'
                          : 'neutral'
                    }
                  >
                    {org.status}
                  </Badge>
                </div>
                <p className="text-sm text-neutral-500">{org.slug}</p>
                {org.description && (
                  <p className="mt-2 text-sm text-neutral-600">{org.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}
