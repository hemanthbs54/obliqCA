'use client';

import { useParams } from 'next/navigation';
import { RagChatPanel } from '@/components/dashboard/RagChatPanel';

export default function ClientChatPage() {
  const params = useParams<{ id: string }>();
  return <RagChatPanel clientId={params.id} />;
}
