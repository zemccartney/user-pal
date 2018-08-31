'use strict';

const Joi = require('joi');
const SecurePassword = require('secure-password');
const Boom = require('boom');

//new instance of SecurePassword using the default config
const Pwd = new SecurePassword();

const internals = {};

module.exports = (server, options) => {

    return {
        method: 'POST',
        path: '/users/reset-password',
        config: {
            description: 'Reset password for a user',
            tags: ['api'],
            validate: {
                payload: {
                    email: Joi.string().email().required(),
                    resetToken: Joi.string().required(),
                    newPassword: Joi.string().required()
                }
            },
            auth: false
        },
        handler: async (request, h) => {

            const { Users } = request.models();
            const Payload = request.payload;

            const foundUser = await Users.query()
                .where({ email: Payload.email })
                .whereNotNull('resetToken')
                .first();

            if (!foundUser) {
                return Boom.badRequest('Invalid user');
            }

            const userToken = Buffer.from(Payload.resetToken);
            const hashToken = Buffer.from(foundUser.resetToken);

            const result = Pwd.verifySync(userToken, hashToken);

            if (result === SecurePassword.INVALID_UNRECOGNIZED_HASH ||
                result === SecurePassword.INVALID) {

                return Boom.unauthorized('Token is invalid');
            }
            else if (result === SecurePassword.VALID ||
                result === SecurePassword.VALID_NEEDS_REHASH) {

                const newPassword = Buffer.from(Payload.newPassword);

                const newHash = Pwd.hashSync(newPassword);

                await Users.query()
                    .patch({
                        'password': newHash.toString('utf8'),
                        'resetToken': null
                    })
                    .where({ id: foundUser.id });

                return h.response().code(200);
            }
        }
    };
};
