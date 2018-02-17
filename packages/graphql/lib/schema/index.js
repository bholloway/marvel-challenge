const {makeExecutableSchema} = require('graphql-tools');

const {indent} = require('../util/string');
const {createWithParams} = require('../util/fetch');

/**
 * The base entries in the api tree imply queries in the GraphQL schema. But we can merge the
 * singular and plural into a single query.
 *
 * The models convert directly into types.
 */
const createTypeDefs = ({tree, models}) => {
  const queryDefs = Object.entries(tree).map(([name, {plural, singular, type}]) => {
    const merged = {...plural.query, ...singular.query};
    const parameters = Object.entries(merged)
      .map(([name, type]) => `${name}:${type}`)
      .join(', ');
    return `${name}(${parameters}) : ${type}`;
  });

  const modelDefs = Object.entries(models).map(([name, content]) =>
    [
      `type ${name} {`,
      ...Object.entries(content)
        .map(([name, type]) => {
          const index = Object.entries(tree).findIndex(
            ([queryName, {type: queryType}]) => queryName === name && queryType === type
          );
          return index < 0 ? `${name}:${type}` : queryDefs[index];
        })
        .map(indent(2)),
      '}'
    ].join('\n')
  );

  return [
    'schema { query: RootQuery }',
    'type RootQuery {',
    ...queryDefs.map(indent(2)),
    '}',
    ...modelDefs
  ].join('\n');
};

/**
 * The DataContainer has a nested results field. Inside each field we need to make sure the
 * parameters of the parent are stored privately.
 *
 * @param {function():object} resultToParams A function that takes result element and yields params
 * @returns {function(object):object} A transform function for the DataContainer
 */
const addParamsToDataContainer = (resultToParams) => ({results, ...rest}) => ({
  ...rest,
  results: results.map((result) => ({...result, _params: resultToParams(result)}))
});

/**
 * The base entries in the api tree imply resolvers for query types.
 */
const creteResolvers = ({tree, models}) => {
  /**
   * Find the Array element type in the DataContainer results
   *
   * @param {string} type The type of a DataContainer
   * @returns {false|string} False if not found else the type of the results elements
   */
  const findDataType = (type) => {
    const dataContainerModel = models[type];
    const dataType = dataContainerModel.results;
    const match = /^\[?(\w+)]?$/.exec(dataType);
    return match && match[1];
  };

  // implement the root query
  const queries = Object.entries(tree).reduce(
    (acc, [name, {plural, singular}]) => ({
      ...acc,
      [name]: (parent, params, {fetch}) => {
        const _params = (parent && parent._params) || {};
        const fetchWithQuery = createWithParams({..._params, ...params})(fetch);
        const idParam = Object.keys(singular.query).shift();
        const id = params[idParam];

        // must break open DataWrapper response to get DataContainer type
        // then we must taint each DataContainer result with private params
        return fetchWithQuery((id === undefined ? plural : singular).path)
          .then(({data}) => data)
          .then(addParamsToDataContainer(({id}) => ({..._params, [name]: id})));
      }
    }),
    {}
  );

  // now we need to implement any nested fields on the results types
  const types = Object.entries(tree).reduce((acc0, [name, {type}]) => {
    const elementType = findDataType(type);
    if (!elementType) {
      throw new Error(`cannot find model for data type "${dataType}"`);
    }
    const fields = Object.entries(models[elementType]).reduce((acc1, [field, requiredType]) => {
      const [name] =
        Object.entries(tree).find(([k, {type: queryType}]) => queryType === requiredType) || [];
      return name ? {...acc1, [field]: queries[name]} : acc1;
    }, {});

    return {...acc0, [elementType]: fields};
  }, {});

  return {
    RootQuery: queries,
    ...types
  };
};

/**
 * Convert scraped data to a GraphQL schema.
 */
exports.createSchema = (data, fetch) =>
  makeExecutableSchema({
    typeDefs: createTypeDefs(data),
    resolvers: creteResolvers(data, fetch)
  });
