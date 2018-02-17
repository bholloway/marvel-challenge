const commonPrefix = require('common-path-prefix');
const {pascalCase} = require('change-case');

/**
 * Convert lowercase swagger type to uppercase GraphQL type.
 *
 * Double becomes Float. Date is string representation of date anyway.
 *
 * @param {string} candidate Primitive type to convert
 * @return {string} GraphQL compatible primitive type
 */
const convertPrimitive = (candidate) => {
  switch (true) {
    case /date/i.test(candidate):
      return 'String';
    case /double/i.test(candidate):
      return 'Float';
    default:
      return pascalCase(candidate);
  }
};
exports.convertPrimitive = convertPrimitive;

/**
 * Analyse resources and determine a resource tree.
 *
 * The resources `/list` implies the "plural", `/list/{id}` implies the "singular", and all
 * `/list/{id}/list` are the children.
 *
 * @param {object} input The api section of the swagger data.
 * @returns function ({models: object}):{{models:object, resources:object, tree:object}}
 */
const parseAPI = (input) => ({models}) => {
  // convert resource containers and primitive types
  const convertType = (candidate) => {
    switch (true) {
      // array notation [foo] is recursed
      case /^\[\w+]/.test(candidate):
        return `[${convertType(candidate.slice(1, -1))}]`;

      // response wrapper is expanded
      case /DataWrapper$/.test(candidate):
        return convertType(models[candidate].data);

      // use any other custom type as-is
      case candidate in models:
        return candidate;

      // simple types
      default:
        return convertPrimitive(candidate);
    }
  };

  // find the portion of the path prefix in common
  const prefix = commonPrefix(input.map(({path}) => path));

  // list all resources we can GET
  const resources = input
    .map(({path, operations}) => {
      // split on "/" or on "/{someParam}/"
      const segments = [prefix, ...path.slice(prefix.length).split('/')];

      // we can assume there is at most one per operation path
      const getOperation = operations.find(({httpMethod}) => httpMethod === 'GET');

      // extract some limited details for each GET method supported by the API
      if (getOperation) {
        const {summary: description, parameters, responseClass} = getOperation;
        const type = convertType(responseClass);
        const query = parameters.reduce(
          (acc, {name, dataType}) => ({...acc, [name]: convertType(dataType)}),
          {}
        );
        return {path, segments, description, query, type};
      } else {
        return null;
      }
    })
    .filter(Boolean);

  // organise the resources as {singular, plural, children}
  const tree = resources.filter(({segments}) => segments.length === 2).reduce((acc, plural) => {
    const singular = resources.find(
      ({segments, path}) => segments.length === 3 && path.startsWith(plural.path)
    );

    const type = plural.type === singular.type ? plural.type : null;

    const children = resources
      .filter(({segments, path}) => segments.length === 4 && path.startsWith(singular.path))
      .reduce((acc, resource) => ({...acc, [resource.segments[3]]: resource}), {});

    return {...acc, [plural.segments[1]]: {singular, plural, type, children}};
  }, {});

  return {models, resources, tree};
};
exports.parseAPI = parseAPI;

/**
 * Simplify the models into a hash of fields and their types.
 *
 * Wrappers are unwrapped to DataContainers.
 *
 * Lists imply nested resources and so are converted to DataContainers.
 *
 * Summary type are converted to the full type.
 *
 * @param {object} input The models portion of the swagger data.
 * @returns {{models: object}} A hash of models with converted types
 */
const parseModels = (input) => {
  // create an initial simplified lookup table of the type and its member types
  const pending = Object.values(input).reduce(
    (acc0, {id, properties}) => ({
      ...acc0,
      [id]: Object.entries(properties).reduce((acc1, [name, {type, items}]) => {
        if (type === 'Array') {
          const {$ref: elementType} = items;
          return {...acc1, [name]: `[${elementType}]`};
        } else {
          return {...acc1, [name]: type};
        }
      }, {})
    }),
    {}
  );

  // now we have the lookup we can expand any useless containers and convert primitive types
  // convert lists and summaries and primitive types but not resource containers
  const convertType = (candidate) => {
    switch (true) {
      // we can substitute the full type for the summary
      case /^\[\w+Summary]$/.test(candidate):
        return convertType(`${candidate.slice(1, -8)}DataContainer`);

      // array notation [foo] is recursed
      case /^\[\w+]/.test(candidate):
        return `[${convertType(candidate.slice(1, -1))}]`;

      // lists are expanded
      case /List$/.test(candidate):
        return convertType(`${candidate.slice(0, -4)}DataContainer`);

      // we can substitute the full type for the summary
      case /Summary$/.test(candidate):
        return convertType(candidate.slice(0, -7));

      // use any other custom type as-is
      case candidate in pending:
        return candidate;

      // simple types
      default:
        return convertPrimitive(candidate);
    }
  };

  const models = Object.entries(pending)
    .filter(([name]) => !/(List|Summary)$/.test(name))
    .reduce(
      (acc0, [id, properties]) => ({
        ...acc0,
        [id]: Object.entries(properties).reduce(
          (acc1, [name, type]) => ({...acc1, [name]: convertType(type)}),
          {}
        )
      }),
      {}
    );

  return {models};
};
exports.parseModels = parseModels;

/**
 * Scrape the schema from developer.marvel.com
 *
 * @see https://gateway.marvel.com/docs/public
 */
exports.parse = ({models, apis}) => parseAPI(apis)(parseModels(models));
