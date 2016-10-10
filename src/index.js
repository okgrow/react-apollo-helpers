// eslint-disable-next-line import/no-unresolved
import { graphql } from 'react-apollo'; // peer dependency
import _ from 'underscore';

const composeGraphQL = (docOrOperation, ...rest) => {
  let composedOperation;

  // a simplistic type checker
  const isDocument = (obj = {}) => !!(obj.kind === 'Document');
  const isDocOrOp = (obj = {}) => (isDocument(obj) || isDocument(obj.document));

  const document = isDocument(docOrOperation) ? docOrOperation : docOrOperation.document;
  if (document.kind !== 'Document') {
    throw new Error(`composeGraphQL: A document is required. Instead got ${document}.`);
  }

  const {
    name,
    options,
  } = isDocument(docOrOperation) ? {} : docOrOperation;

  // TODO: throw error if the document has more than one operation (or zero, if that's possible)

  let operationType;
  let operationName;
  try {
    // These look fragile but should be robust in the  current use case as long as
    // the document is specified correctly with a single operation.
    operationType = document.definitions[0].operation;
    operationName = name ||
      document.definitions[0].selectionSet.selections[0].name.value;
  } catch (e) {
    console.log(e);
    throw new Error('composeGraphQL: could not parse document.');
  }

  // Just use graphql's api for queries
  if (operationType === 'query') {
    composedOperation = graphql(document, { options, name });
  }

  // Generate default props and variables for the mutation
  if (operationType === 'mutation') {
    const setProps = ({ ownProps, mutate }) => ({
      // Use the mutation's name (as spec'd in the document) as a prop key
      [operationName]: (args) => {
        const defaultOptions = {
          // graphql() will hand us an object with arguments. These can usually be
          // passed back to the mutate function with no changes.
          variables: args,
        };

        let mutationOptions = Object.assign({}, defaultOptions, options);

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
    composedOperation = graphql(document, { props: setProps });
  }

  // for composition
  // TODO: This should throw an error if the array has a component (or any non-document)
  // anywhere but at the last position - anything after that will be ignored
  const next = _.first(rest);
  const shouldRenderComponent = (rest.length === 1 && !isDocOrOp(next));
  const shouldCompose = (isDocOrOp(next));

  if (shouldRenderComponent) {
    return composedOperation(next);
  }
  if (shouldCompose) {
    return composedOperation(composeGraphQL.apply(this, rest));
  }
  // just return the output of graphql for the dev to compose on their own
  // XXX This doesn't compose the way proposed@ar. You if you had two composed ops and
  // a component, you have to call (op1(op2(component))).
  // TODO: support op1(op2)(component)
  return composedOperation;
};

export default composeGraphQL;
