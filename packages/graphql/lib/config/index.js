const convict = require('convict');

const {withCustomFormats} = require('./custom-formats');
const {convictToMarkdown} = require('../util/convict');

const definition = withCustomFormats(convict)({
  env: {
    doc: 'The application environment.',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV'
  },
  server: {
    port: {
      doc: 'The port to bind.',
      format: 'port',
      default: 3000,
      env: 'PORT'
    },
    ip: {
      doc: 'The IP address to bind.',
      format: 'ipaddress',
      default: '0.0.0.0',
      env: 'IP_ADDRESS'
    }
  },
  marvel: {
    url: {
      doc: 'The URL for the marvel API.',
      format: 'url',
      default: 'http://gateway.marvel.com',
      env: 'MARVEL_URL'
    },
    schemaPath: {
      doc: 'The path for the marvel API schema.',
      format: 'urlpath',
      default: '/docs/public',
      env: 'MARVEL_SCHEMA_PATH'
    },
    publicKey: {
      doc: 'A public key for the marvel API.',
      format: 'hexadecimal32',
      default: null,
      env: 'MARVEL_PUBLIC_KEY'
    },
    privateKey: {
      doc: 'A private key for the marvel API.',
      format: 'hexadecimal40',
      default: null,
      env: 'MARVEL_PRIVATE_KEY'
    }
  },
  cache: {
    ttl: {
      doc: 'Number of seconds to cache results from mavel API, or zero for uncached.',
      format: 'nat',
      default: 10,
      env: 'CACHE_TTL'
    },
    size: {
      doc: 'Number of cache results from mavel API, or zero for uncached.',
      format: 'nat',
      default: 10,
      env: 'CACHE_SIZE'
    }
  }
});
exports.definition = definition;

exports.config = definition.validate({allowed: 'strict'}).getProperties();

// print the config when this file is run directly
if (require.main === module) {
  console.log(convictToMarkdown(definition));
}
