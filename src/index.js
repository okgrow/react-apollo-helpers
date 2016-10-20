import R from 'ramda';
// eslint-disable-next-line import/no-unresolved
import { graphql as originalGraphql } from 'react-apollo'; // peer dependency

// Wrap react-apollo's graphql() function with a new version that
// * provides some useful default values to decrease boilerplate/repetition
// * makes certain mutation options be individually callable as functions (rather
//   than passing a big props fn)
const graphql = (document, config = {}) => {
  if (!document) {
    throw new Error(`graphql(react-apollo-helpers): A document is required. Instead got:
        ${JSON.stringify(document)}.`);
  }
  if (document.definitions.length !== 1) {
    throw new Error(`graphql(react-apollo-helpers): Expected 1 graphQL operation. ${document.definitions.length} operations detected.`);
  }

  // gather operation info from the graphQL document
  const definitions = document.definitions[0];
  const operationType = document.definitions[0].operation;
  const clientOperationName = R.path(['name', 'value'], definitions);
  const schemaOperationName = R.path(
    ['selectionSet', 'selections', '0', 'name', 'value'],
    definitions
  );
  // set operationName with first defined of (1) user-specified name, (2) the name given to the
  // calling operation on the client, or (3 - always present) the name of the operation called
  // on the GraphQL schema.
  const operationName = name || clientOperationName || schemaOperationName;

  if (operationType === 'query') {
    config.name = operationName;
    return originalGraphql(document, config);
  }

  if (operationType === 'mutation') {
    const { options } = config;

    // The original graphql() fn has us pass a somewhat involved props function to specify
    // prop name, variables, and mutation options. Here, we use our default values to
    // simplify this, supporting `name` as an alternative to the props fn as well making
    // individual options callable as functions rather than building the whole props object.
    // You can override this (back to the original graphql() functionality) by passing a
    // props function.
    const setProps = config.props || (({ ownProps, mutate }) => ({
      // Use our default operationName as the name of the prop passed to the child component.
      [operationName]: (args) => {
        // If the user passes functions for the following options, call them so they can
        // have access to args & ownProps
        const evalOption = opt => (typeof opt === 'function' ? opt(args, ownProps) : opt);
        // Preset the first level of the optimisticResponse object, which is pure boilerplate,
        // but allow user to use the full object if preferred.
        // TODO: query the type returned by the mutation and fill that in as well
        // TODO: if the return type includes a field called id or _id, automatically generate
        //       a random value for that.
        let optimisticResponse = null;
        if (R.has('optimisticResponse', options)) {
          const optimisticResponseSpec = evalOption(options.optimisticResponse);
          if (!optimisticResponseSpec.__typename) {
            throw new Error('react-apollo-helpers: __typename not found in optimisticResponse. ' +
              'You should set it to the return type of the mutation that you called.');
          }
          optimisticResponse = optimisticResponseSpec.__typename === 'Mutation'
            // user is building the full optimisticResponseSpec object
            ? optimisticResponseSpec
            // add the base JSON for the user
            : {
              __typename: 'Mutation',
              [operationName]: optimisticResponseSpec,
            };
        }
        // originalGraphql() will hand us an object with arguments. These can usually be
        // passed back to the mutate function with no changes, so use as the default value.
        const variables = evalOption(options.variables) || args;

        // Destructure result.mutationResult.data directly to each update function in updateQueries
        // as `result` so we don't have to dig through the same properties every time
        const updateQueries = R.map((updateFn) =>
          (prev, result) =>
            updateFn(prev, R.path(['mutationResult', 'data', operationName], result)),
          options.updateQueries
        );

        const mutationOptions = Object.assign({}, options, {
          variables,
          optimisticResponse,
          updateQueries,
        });
        return mutate(mutationOptions);
      },
    }));
    return originalGraphql(document, { props: setProps });
  }

  // If passed an operation that is not recognized, it might be a new function not yet
  // supported here. Pass on to the original graphql() function so the dev doesn't have
  // to import it separately.
  console.log(`graphql(react-apollo-helpers): Operation '${operationType}' is not supported. Passing to react-apollo`);
  return originalGraphql(document, config);
};

// Convenience functions

// Use the parameters of the mutation plus any additional fields provided by the user to create
// an optimisticResponse
const optimisticResponse = (additionalFields = {}) => (args) => {
  // TODO: query schema to generate default __typename
  // TODO: allow user to pass a fn
  return Object.assign(args, additionalFields);
};

export { graphql, optimisticResponse };
