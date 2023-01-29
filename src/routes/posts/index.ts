import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<PostEntity[]> {
      return await fastify.db.posts.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
        const post = await fastify.db.posts.findOne({key: 'id', equals: request.params.id});
        if (!post) throw reply.code(404);

        return post;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createPostBodySchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
        const {title, content} = request.body;
        if (!title && !content) {
            throw reply.code(400);
        }

        const post = await fastify.db.posts.create(request.body);
        if (!post) throw reply.code(400);

        return post;
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
       try {
           return await fastify.db.posts.delete(request.params.id);
       }
       catch {
           throw reply.code(400);
       }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
        const id = request.params.id;
        const {title, content} = request.body;
        if (!title && !content) {
            throw reply.code(400);
        }
        const post = await fastify.db.posts.change(id, request.body);
        if (!post) {
            throw reply.code(404);
        }

        return post;
    }
  );
};

export default plugin;
