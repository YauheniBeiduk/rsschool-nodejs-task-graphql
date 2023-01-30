import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<
    MemberTypeEntity[]
  > {
      return await fastify.db.memberTypes.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
        const id = request.params.id;

        const memberType = await fastify.db.memberTypes.findOne({key: 'id', equals: id});
            if (!memberType) throw reply.code(404);
            return memberType;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeMemberTypeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
        const id = request.params.id;
        const {discount, monthPostsLimit} = request.body;
        if (!discount && !monthPostsLimit) {
            throw reply.code(400);
        }

        const memberType = await fastify.db.memberTypes.change(id, request.body);
        if (!memberType) throw reply.code(400);

        return memberType;
    }
  );
};

export default plugin;
