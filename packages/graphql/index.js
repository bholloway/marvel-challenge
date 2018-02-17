const bail = (error) => {
  console.error(error);
  process.exit(1);
};
process.on('uncaughtException', bail);
process.on('unhandledRejection', bail);

const fetch = require('node-fetch');
const compose = require('compose-function');
const chalk = require('chalk');

const {parse} = require('./lib/marvel/scraper');
const {createWithMarvel} = require('./lib/marvel/fetcher');
const {createWithCache} = require('./lib/marvel/cache');
const {createSchema} = require('./lib/schema');
const {withJson, createWithLogging} = require('./lib/util/fetch');
const server = require('./lib/server');

// configuration
const {config} = require('./lib/config');
console.log(`config: ${JSON.stringify(config, null, 2)}`);

// decorate our fetch function with json response and logging
const withLogging = createWithLogging((...args) => console.log(chalk.hex('#aaa')(args.join(' '))));
const withMarvel = createWithMarvel(config.marvel);
const withCache = createWithCache(config.cache);

Promise.resolve()
  .then(() => {
    const {url, schemaPath} = config.marvel;
    const schemaURL = `${url}${schemaPath}`;

    console.log(`fetching swagger schema (${schemaURL})`);
    return compose(withJson, withLogging)(fetch)(schemaURL);
  })
  .then((data) => {
    console.log('parsing swagger schema');
    return parse(data);
  })
  .then((parsed) => {
    console.log('creating a GraphQL schema');
    return createSchema(parsed);
  })
  .then((schema) => {
    console.log('starting GraphQL server');
    return server(
      {env: config.env, ...config.server},
      schema,
      compose(withJson, withCache, withMarvel, withLogging)(fetch)
    );
  })
  .then((binding) => console.log(`server is listening on ${binding}`))
  .catch(bail);
