import React from 'react';
import { act } from 'react-dom/test-utils';
import { createMemoryHistory } from 'history';

import {
  mountWithContexts,
  waitForElement,
} from '../../../../testUtils/enzymeHelpers';
import { ExecutionEnvironmentsAPI, CredentialTypesAPI } from '../../../api';
import ExecutionEnvironmentAdd from './ExecutionEnvironmentAdd';

jest.mock('../../../api');

const mockMe = {
  is_superuser: true,
  is_system_auditor: false,
};

const executionEnvironmentData = {
  name: 'Test EE',
  credential: 4,
  description: 'A simple EE',
  image: 'https://registry.com/image/container',
  pull: 'one',
  summary_fields: {
    credential: {
      id: 4,
      name: 'Container Registry',
      description: '',
      kind: 'registry',
      cloud: false,
      kubernetes: false,
      credential_type_id: 17,
    },
  },
};

const mockOptions = {
  data: {
    actions: {
      POST: {
        pull: {
          choices: [
            ['one', 'One'],
            ['two', 'Two'],
            ['three', 'Three'],
          ],
        },
      },
    },
  },
};

const containerRegistryCredentialResolve = {
  data: {
    results: [
      {
        id: 4,
        name: 'Container Registry',
        kind: 'registry',
      },
    ],
  },
};

describe('<ExecutionEnvironmentAdd/>', () => {
  let wrapper;
  let history;

  beforeEach(async () => {
    CredentialTypesAPI.read.mockResolvedValue(
      containerRegistryCredentialResolve
    );
    history = createMemoryHistory({
      initialEntries: ['/execution_environments'],
    });
    ExecutionEnvironmentsAPI.readOptions.mockResolvedValue(mockOptions);
    ExecutionEnvironmentsAPI.create.mockResolvedValue({
      data: {
        id: 42,
      },
    });
    await act(async () => {
      wrapper = mountWithContexts(<ExecutionEnvironmentAdd me={mockMe} />, {
        context: { router: { history } },
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    wrapper.unmount();
  });

  test('handleSubmit should call the api and redirect to details page', async () => {
    await act(async () => {
      wrapper.find('ExecutionEnvironmentForm').prop('onSubmit')({
        executionEnvironmentData,
      });
    });
    wrapper.update();
    expect(ExecutionEnvironmentsAPI.create).toHaveBeenCalledWith({
      executionEnvironmentData,
    });
    expect(history.location.pathname).toBe(
      '/execution_environments/42/details'
    );
  });

  test('handleCancel should return the user back to the execution environments list', async () => {
    await waitForElement(wrapper, 'ContentLoading', el => el.length === 0);

    wrapper.find('Button[aria-label="Cancel"]').simulate('click');
    expect(history.location.pathname).toEqual('/execution_environments');
  });

  test('failed form submission should show an error message', async () => {
    const error = {
      response: {
        data: { detail: 'An error occurred' },
      },
    };
    ExecutionEnvironmentsAPI.create.mockImplementationOnce(() =>
      Promise.reject(error)
    );
    await act(async () => {
      wrapper.find('ExecutionEnvironmentForm').invoke('onSubmit')(
        executionEnvironmentData
      );
    });
    wrapper.update();
    expect(wrapper.find('FormSubmitError').length).toBe(1);
  });
});
