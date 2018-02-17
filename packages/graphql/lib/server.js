const Express = require('express');
const expressGraphQL = require('express-graphql');
const cors = require('cors');
const morgan = require('morgan');
const expressBlankFavicon = require('express-blank-favicon');

/**
 * Create a GraphQL server.
 *
 * @param {Number} port Server port
 * @param {String} ip Server ip address
 * @param {String} env The NODE_ENV
 * @param {String} schema A graphQL schema
 * @param {function} fetch A fetch method specific to the marvel API
 * @return {Promise<string>} Resolves with the ip:port or rejects with error
 */
module.exports = ({port, ip, env}, schema, fetch) => {
  const gql = expressGraphQL((_req, _res, {query, variables}) => {
    if (query) {
      console.log(`query: ${query.replace(/(^\s*|\s*$)/g, '')}`);
    }
    if (variables) {
      console.log(`variables: ${JSON.stringify(variables)}`);
    }

    const startTime = process.hrtime();
    return {
      schema,
      context: {fetch},
      graphiql: env !== 'production',
      extensions: () => {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const time = seconds + 1e-9 * nanoseconds;
        return {time};
      }
    };
  });

  const app = Express();

  app.use(morgan(env === 'production' ? 'short' : 'dev'));

  app.options('/', cors());
  app.use(expressBlankFavicon);
  app.use('/', cors(), gql);

  return new Promise((resolve, reject) =>
    app.listen(port, ip, (error) => (error ? reject(error) : resolve(`http://${ip}:${port}`)))
  );
};
