// eslint-disable-next-line import/no-unresolved
import { graphql as originalGraphql } from 'react-apollo'; // peer dependency

const graphql = (document, config) => {
  if (!document) {
    throw new Error(`graphql(react-apollo-helpers): A document is required. Instead got ${document}.`);
  }
  if (document.definitions.length !== 1) {
    throw new Error(`graphql(react-apollo-helpers): Expected 1 graphQL operation. ${document.definitions.length} operations detected.`);
  }

  // gather operation info from the document
  let operationType;
  let operationName;
  let schemaOperationName;
  try {
    const definitions = document.definitions[0];
    operationType = document.definitions[0].operation;
    operationName = definitions.name && definitions.name.value;
    schemaOperationName = definitions.selectionSet.selections[0].name.value;
  } catch (e) {
    console.log(e);
    throw new Error('graphql(react-apollo-helpers): could not parse document.');
  }

  // Just use graphql's api for queries
  if (operationType === 'query') {
    return originalGraphql(document, config);
  }

  // Generate default props and variables for the mutation
  if (operationType === 'mutation') {
    const setProps = ({ ownProps, mutate }) => ({
      // Use the mutation's name (as spec'd in the document) as a prop key
      [name || schemaOperationName]: (args) => { // XXX fix this
        const defaultOptions = {
          // graphql() will hand us an object with arguments. These can usually be
          // passed back to the mutate function with no changes.
          variables: args,
        };

        let mutationOptions = Object.assign(config.options || {}, defaultOptions);


        // If the user passes functions for the following, call them so they can
        // have access to args & ownProps
        const callableProps = ['optimisticResponse', 'variables'];
        callableProps.forEach((propName) => {
          if (typeof mutationOptions[propName] === 'function') {
            mutationOptions[propName] = mutationOptions[propName](args, ownProps);
          }
        });

        // fix updateQueries so we don't have to dig through the same properties every time
        if (mutationOptions.updateQueries) {
          const fixedUpdateQueries = {};
          Object.keys(mutationOptions.updateQueries).forEach((queryName) => {
            const updateFn = mutationOptions.updateQueries[queryName];
            fixedUpdateQueries[queryName] = (prev, result) => {
              const mutationResult = result.mutationResult.data[operationName];
              return updateFn(prev, mutationResult);
            };
          });

          // prevent an error that comes from mutating mutationOptions in place
          mutationOptions = Object.assign({},
            mutationOptions,
            { updateQueries: fixedUpdateQueries }
          );
        }

        return mutate(mutationOptions);
      },
    });
    return originalGraphql(document, { props: setProps });
  }

  throw new Error(`graphql(react-apollo-helpers): Operation '${operationType}' is not supported.`);
};

export { graphql };
