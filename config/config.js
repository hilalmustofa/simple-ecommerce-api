require('dotenv').config();

module.exports = {
    development: {
        username: process.env.db_username_dev,
        password: process.env.db_password_dev,
        database: process.env.db_dev,
        host: "localhost",
        dialect: "mysql",
    },
    production: {
        username: process.env.db_username,
        password: process.env.db_password,
        database: process.env.db_prod,
        host: process.env.db_host,
        dialect: "mysql",
    },
};
