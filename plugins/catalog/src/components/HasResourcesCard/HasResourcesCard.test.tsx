/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Entity, RELATION_HAS_PART } from '@backstage/catalog-model';
import {
  catalogApiRef,
  EntityProvider,
  entityRouteRef,
} from '@backstage/plugin-catalog-react';
import { catalogApiMock } from '@backstage/plugin-catalog-react/testUtils';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { waitFor, screen } from '@testing-library/react';
import { PropsWithChildren, ComponentType, ReactNode } from 'react';
import { HasResourcesCard } from './HasResourcesCard';

describe('<HasResourcesCard />', () => {
  const catalogApi = catalogApiMock.mock();
  let Wrapper: ComponentType<PropsWithChildren<{}>>;

  beforeEach(() => {
    Wrapper = ({ children }: { children?: ReactNode }) => (
      <TestApiProvider apis={[[catalogApiRef, catalogApi]]}>
        {children}
      </TestApiProvider>
    );
  });

  afterEach(() => jest.resetAllMocks());

  it('shows empty list if no relations', async () => {
    const entity: Entity = {
      apiVersion: 'v1',
      kind: 'System',
      metadata: {
        name: 'my-system',
        namespace: 'my-namespace',
      },
      relations: [],
    };

    await renderInTestApp(
      <Wrapper>
        <EntityProvider entity={entity}>
          <HasResourcesCard />
        </EntityProvider>
      </Wrapper>,
    );

    expect(screen.getByText('Has resources')).toBeInTheDocument();
    expect(
      screen.getByText(/No resource is part of this system/i),
    ).toBeInTheDocument();
  });

  it('shows related resources', async () => {
    const entity: Entity = {
      apiVersion: 'v1',
      kind: 'System',
      metadata: {
        name: 'my-system',
        namespace: 'my-namespace',
      },
      relations: [
        {
          targetRef: 'resource:my-namespace/target-name',
          type: RELATION_HAS_PART,
        },
      ],
    };
    catalogApi.getEntitiesByRefs.mockResolvedValue({
      items: [
        {
          apiVersion: 'v1',
          kind: 'Resource',
          metadata: {
            name: 'target-name',
            namespace: 'my-namespace',
          },
          spec: {},
        },
      ],
    });

    await renderInTestApp(
      <Wrapper>
        <EntityProvider entity={entity}>
          <HasResourcesCard />
        </EntityProvider>
      </Wrapper>,
      {
        mountedRoutes: {
          '/catalog/:namespace/:kind/:name': entityRouteRef,
        },
      },
    );

    await waitFor(() => {
      expect(screen.getByText('Has resources')).toBeInTheDocument();
      expect(screen.getByText(/target-name/i)).toBeInTheDocument();
    });
  });
});
