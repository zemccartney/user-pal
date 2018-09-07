'use strict';

// Leaving empty leads to default (requiring module by file name to set as registered plugin)
// module.exports = {};
module.exports = (server, options) => ({
    plugins: {
        options: {
            actAsUser: true,
            userIdProperty: 'userId',//as it's going to appear in the jwt
            userUrlPrefix: '/user',
            userModel: 'users',
            // Ensures tandy is synchronized with our plugin's route prefix, if any
            prefix: server.realm.modifiers.route.prefix
        }
    }
});
