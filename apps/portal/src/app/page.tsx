import Link from 'next/link';
import { Container, PageHeader, Card, CardHeader, CardTitle, CardContent, Badge } from '@ahi/ui';

export default function HomePage() {
  const services = [
    {
      name: 'AHI-WS',
      description: 'Shared workspace. AHI-Or routes to free AI models. AHI-SuBiet evaluates results.',
      href: '/workspace',
      status: 'active' as const,
    },
    {
      name: 'AHI-Or Chat',
      description: 'Direct chat with multiple AI providers. Conversations saved to DBRS.',
      href: '/chat',
      status: 'active' as const,
    },
    {
      name: 'AHI Knowledge',
      description: 'Knowledge bases with pgvector semantic search. DBV + DBRS storage.',
      href: '/knowledge',
      status: 'active' as const,
    },
    {
      name: 'AI Models',
      description: 'Available AI models across providers (OpenAI, Gemini, Ollama).',
      href: '/ai',
      status: 'active' as const,
    },
    {
      name: 'Organizations',
      description: 'Manage organizations, members, and roles.',
      href: '/organizations',
      status: 'active' as const,
    },
    {
      name: 'ERP',
      description: 'ERP data aggregation and sync across systems.',
      href: '/erp',
      status: 'active' as const,
    },
  ];

  return (
    <Container size="lg">
      <PageHeader
        title="AHI Ecosystem"
        description="Evolving AI system with orchestration, governance, and persistent knowledge across time and space."
      />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {services.map((service) => (
          <Link key={service.name} href={service.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{service.name}</CardTitle>
                  <Badge variant={service.status === 'active' ? 'success' : 'neutral'}>
                    {service.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600">{service.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  );
}
