'use strict';

const Dotenv = require('dotenv');
const Confidence = require('confidence');
const Hoek = require('hoek');

const internals = {};

// Pull .env into process.env
if (process.env.NODE_ENV === 'test'){
    Dotenv.config({ path: `${__dirname}/.env-test` });
}
else {
    Dotenv.config({ path: `${__dirname}/.env` });
}

// Ensures hapi is ok with our supplied API_PREFIX
internals.mainOptions = () => {

    const defaults = {
        options: {
            jwtKey: process.env.JWT_SECRET
        }
    };

    // regex matches (i.e. plagiarized from) hapi/lib/config (for validating route prefix vals)
    if (process.env.API_PREFIX && process.env.API_PREFIX.match(/^\/.+/)) {
        return Hoek.applyToDefaults(defaults, {
            routes: {
                prefix: process.env.API_PREFIX
            }
        });
    }

    return defaults;
};

// Glue manifest as a confidence store
module.exports = new Confidence.Store({
    server: {
        host: '0.0.0.0',
        port: process.env.PORT || 3000,
        debug: {
            $filter: 'NODE_ENV',
            development: {
                log: ['error', 'implementation', 'internal'],
                request: ['error', 'implementation', 'internal']
            }
        }
    },
    register: {
        plugins: [
            {
                plugin: '../lib', // Main plugin
                ...internals.mainOptions()
            },
            {
                plugin: './plugins/swagger'
            },
            {
                plugin: 'schwifty',
                options: {
                    $filter: 'NODE_ENV',
                    $default: {},
                    $base: {
                        migrateOnStart: true,
                        knex: {
                            client: 'sqlite3',
                            useNullAsDefault: true,         // Suggested for sqlite3
                            pool: {
                                idleTimeoutMillis: Infinity // Handles knex v0.12/0.13 misconfiguration when using sqlite3 (tgriesser/knex#1701)
                            },
                            connection: {
                                filename: ':memory:'
                            }
                        }
                    },
                    development: {
                        migrateOnStart: true,
                        knex: {
                            client: 'pg',
                            useNullAsDefault: true,
                            connection: {
                                host: process.env.DB_HOST,
                                user: process.env.DB_USER,
                                password: process.env.DB_PASSWORD,
                                database: process.env.DB_NAME
                            }
                        }
                    },
                    test: {
                        migrateOnStart: true,
                        knex: {
                            client: 'pg',
                            useNullAsDefault: true,
                            connection: {
                                host: process.env.DB_HOST,
                                user: process.env.DB_USER,
                                password: process.env.DB_PASSWORD,
                                database: process.env.DB_NAME
                            }
                        }
                    },
                    production: {
                        migrateOnStart: false
                    }
                }
            }
        ]
    }
});
