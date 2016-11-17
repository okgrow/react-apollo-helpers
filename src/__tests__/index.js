import chai from 'chai';
import td from 'testdouble';
import gql from 'graphql-tag';
import react from 'react';

const gqlDouble = gql`
  query getTodos {
    todos {
      goal
    }
  }`;

const reactApolloMock = td.object(['graphql']);
let graphql;

describe('graphql', () => {

  before(() => {
    td.replace("react-apollo", reactApolloMock);
    graphql = require('../index').graphql;
  });


  it('passes arguments correctly to originalGraphql', () => {
    graphql(gqlDouble);

    td.verify(reactApolloMock.graphql(gqlDouble, {name: 'getTodos'}));
  });
});
