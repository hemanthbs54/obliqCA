'use client';

import { useState, type FormEvent } from 'react';
import { useRagHistory, useRagQuery } from '@/hooks/useRag';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';

export function RagChatPanel({ clientId }: { clientId: string }) {
  const [question, setQuestion] = useState('');
  const { data: history, isLoading } = useRagHistory(clientId);
  const ragQuery = useRagQuery(clientId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    await ragQuery.mutateAsync({ question });
    setQuestion('');
  }

  const entries = [...(history ?? [])].reverse();

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <Input
          placeholder="Ask about this client's documents…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <Button type="submit" disabled={ragQuery.isPending || !question.trim()}>
          {ragQuery.isPending ? 'Asking…' : 'Ask'}
        </Button>
      </form>

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-ink-muted">Loading history…</p>}
        {!isLoading && entries.length === 0 && (
          <p className="text-sm text-ink-muted">
            No questions asked yet. Upload a document, then ask something like &ldquo;What was the
            taxable value on the invoice?&rdquo;
          </p>
        )}
        {entries.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="space-y-2 pt-5">
              <p className="text-sm font-medium text-ink">{entry.question}</p>
              <p className="text-sm text-ink-muted">{entry.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
