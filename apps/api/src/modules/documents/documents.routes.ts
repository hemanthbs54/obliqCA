import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import * as documentsService from './documents.service.js';
import { docTypeSchema } from './documents.schema.js';
import { processDocument } from '../../jobs/documentProcessor.js';

const clientIdParams = z.object({ id: z.string().uuid() });
const documentIdParams = z.object({ id: z.string().uuid() });

export default async function documentsRoutes(fastify: FastifyInstance) {
  fastify.post('/api/clients/:id/documents', async (request, reply) => {
    const { id: clientId } = clientIdParams.parse(request.params);
    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ error: 'BadRequest', message: 'No file uploaded', statusCode: 400 });
    }

    const docTypeField = data.fields.docType;
    const docTypeRaw =
      docTypeField && 'value' in docTypeField ? String(docTypeField.value) : 'other';
    const docType = docTypeSchema.catch('other').parse(docTypeRaw);

    const taskIdField = data.fields.taskId;
    const taskIdRaw = taskIdField && 'value' in taskIdField ? String(taskIdField.value) : '';
    const taskId = z.string().uuid().safeParse(taskIdRaw).success ? taskIdRaw : null;

    const buffer = await data.toBuffer();
    const document = await documentsService.createDocument(fastify.supabaseAdmin, request.user.id, clientId, {
      fileName: data.filename,
      mimeType: data.mimetype ?? null,
      buffer,
      docType,
      taskId,
    });

    // Fire-and-forget: the web app polls GET /api/documents/:id/status.
    void processDocument(fastify.supabaseAdmin, request.user.id, document.id).catch((err) =>
      fastify.log.error(err, 'document processing failed'),
    );

    return reply.code(201).send(document);
  });

  fastify.get('/api/clients/:id/documents', async (request) => {
    const { id: clientId } = clientIdParams.parse(request.params);
    return documentsService.listDocuments(fastify.supabaseAdmin, request.user.id, clientId);
  });

  fastify.get('/api/documents/:id', async (request) => {
    const { id } = documentIdParams.parse(request.params);
    return documentsService.getDocument(fastify.supabaseAdmin, request.user.id, id);
  });

  fastify.get('/api/documents/:id/status', async (request) => {
    const { id } = documentIdParams.parse(request.params);
    const doc = await documentsService.getDocument(fastify.supabaseAdmin, request.user.id, id);
    return { id: doc.id, status: doc.status, errorMessage: doc.error_message };
  });

  fastify.post('/api/documents/:id/reprocess', async (request) => {
    const { id } = documentIdParams.parse(request.params);
    await documentsService.getDocument(fastify.supabaseAdmin, request.user.id, id);
    void processDocument(fastify.supabaseAdmin, request.user.id, id).catch((err) =>
      fastify.log.error(err, 'document reprocessing failed'),
    );
    return { id, status: 'processing' };
  });

  fastify.delete('/api/documents/:id', async (request, reply) => {
    const { id } = documentIdParams.parse(request.params);
    await documentsService.deleteDocument(fastify.supabaseAdmin, request.user.id, id);
    return reply.code(204).send();
  });
}
