// @ts-nocheck
import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<
    ProfileEntity[]
  > {
      return await fastify.db.profiles.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
        const profile = await fastify.db.profiles.findOne({key: 'id', equals: request.params.id});
        if (!profile) throw reply.code(404);

        return profile;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {

        const { userId, memberTypeId} = request.body;

        const user = await fastify.db.users.findOne({ key: 'id', equals: userId });
        if (!user) throw reply.code(400);


        const userProfile = await fastify.db.profiles.findOne({ key: 'userId', equals: userId });

        if (!userProfile) {
            throw reply.code(400);
        }

        const userMemberType = await fastify.db.memberTypes.findOne({key: 'id', equals: memberTypeId});

        if (!userMemberType) {
            throw reply.code(400);
        }

        const profile = await fastify.db.profiles.create(request.body);
        if (!profile) throw reply.code(400);

        return profile;
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
        try {
            return await fastify.db.profiles.delete(request.params.id);
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
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
        const id = request.params.id;
        const profile = await fastify.db.profiles.findOne({key:'id', equals:id});
        if(!profile) {
            throw reply.code(400);
        }

        return  await fastify.db.profiles.change(profile.id, request.body);
    }
  );
};

export default plugin;
