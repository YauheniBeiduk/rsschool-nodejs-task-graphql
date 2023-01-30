import {FastifyPluginAsyncJsonSchemaToTs} from '@fastify/type-provider-json-schema-to-ts';
import {idParamSchema} from '../../utils/reusedSchemas';
import {changeUserBodySchema, createUserBodySchema, subscribeBodySchema,} from './schemas';
import type {UserEntity} from '../../utils/DB/entities/DBUsers';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
      return await fastify.db.users.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
        const user = await fastify.db.users.findOne({key: 'id', equals: request.params.id});

        if (!user) {
            throw reply.code(404);
        }

        return user;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
        // @ts-ignore
        const userId = request.params.id;
        const user = await fastify.db.users.findOne({key: 'id', equals: userId});

        const newUser = await fastify.db.users.create(request.body);

        if (user === newUser) {
            throw reply.code(400);
        }

        return newUser;
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
        const userId = request.params.id;
        const user = await fastify.db.users.findOne({ key: 'id', equals: userId });

        if (!user) {
            throw reply.code(400);
        }

        const userProfile = await fastify.db.profiles.findOne({ key: 'userId', equals: userId });

        if (userProfile) {
            await fastify.db.profiles.delete(userProfile.id);
        }

        const userPosts = await fastify.db.posts.findMany({ key: 'userId', equals: userId });

        for (const userPost of userPosts) {
            await fastify.db.posts.delete(userPost.id);
        }

        const followers = await fastify.db.users.findMany({ key: 'subscribedToUserIds', inArray: userId });

        for (const follower of followers) {
            const deletedUserId = follower.subscribedToUserIds.indexOf(userId);

            follower.subscribedToUserIds.splice(deletedUserId, 1);
            await fastify.db.users.change(follower.id, {
                subscribedToUserIds: follower.subscribedToUserIds
            });
        }

        return await fastify.db.users.delete(userId);
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
        const userId = request.params.id;
        const followerId = request.body.userId;

        if (userId === followerId) {
            throw reply.code(404);
        }

        const user = await fastify.db.users.findOne({ key: 'id', equals: userId });
        const follower = await fastify.db.users.findOne({ key: 'id', equals: followerId });

        if (!user || !follower) {
            throw reply.code(404);
        }

        const hasUserFollowers = follower.subscribedToUserIds.includes(userId);

        if (hasUserFollowers) {
            return follower;
        }

        const subscribedUser = await fastify.db.users.change(followerId, {
                subscribedToUserIds: [...follower.subscribedToUserIds, userId]
            });


        if (!subscribedUser) {
            throw reply.code(404);
        }

        return subscribedUser;
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
        const userId = request.params.id;
        const followerId = request.body.userId;
        const unsubscribedUser = await fastify.db.users.findOne({ key: 'id', equals: userId });
        const user = await fastify.db.users.findOne({ key: 'id', equals: followerId });

        if (!unsubscribedUser || !user) {
            throw reply.code(404);
        }

        const hasUserFollower = unsubscribedUser.subscribedToUserIds.includes(followerId);
        const hasUserSubscriber = user.subscribedToUserIds.includes(userId);

        if (!hasUserFollower || !hasUserSubscriber) {
            throw reply.code(400);
        }

        const updatedUser = await fastify.db.users.change(userId, {
            subscribedToUserIds: unsubscribedUser.subscribedToUserIds.filter(
                (follower) => follower !== followerId
            ),
        });

        await fastify.db.users.change(followerId, {
            subscribedToUserIds: user.subscribedToUserIds.filter(
                (user) => user !== userId
            ),
        });

        return updatedUser;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
        const user = await fastify.db.users.findOne({key:'id', equals: request.params.id});
        if (!user) {
            throw reply.code(400);
        }

        const updatedUser = await fastify.db.users.change(user.id, request.body);

        if (!updatedUser) {
            throw reply.code(400);
        }

        return updatedUser;
    }
  );
};

export default plugin;
