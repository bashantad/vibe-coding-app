import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const defaultAuth = {
  user: null,
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
};

export function renderWithProviders(ui, options = {}) {
  const {
    user = null,
    route = '/',
    routerEntries,
    authOverrides = {},
    routePath,
  } = options;

  const authValue = { ...defaultAuth, user, ...authOverrides };
  const entries = routerEntries || [route];

  function Wrapper({ children }) {
    return (
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={entries}>
          {routePath ? (
            <Routes>
              <Route path={routePath} element={children} />
            </Routes>
          ) : (
            children
          )}
        </MemoryRouter>
      </AuthContext.Provider>
    );
  }

  return { ...render(ui, { wrapper: Wrapper }), authValue };
}

export function createMockUser(overrides = {}) {
  return { id: 1, username: 'testuser', ...overrides };
}

export function createMockArticle(overrides = {}) {
  return {
    id: 1,
    title: 'Test Article',
    description: 'Test description',
    author: 'testuser',
    user_id: 1,
    tags: ['react', 'testing'],
    comments: [],
    ...overrides,
  };
}

export function createMockComment(overrides = {}) {
  return {
    id: 1,
    description: 'Test comment',
    author: 'testuser',
    user_id: 1,
    parent_id: null,
    ...overrides,
  };
}

export function createMockTodo(overrides = {}) {
  return {
    id: 1,
    title: 'Test todo',
    done: false,
    author: 'testuser',
    ...overrides,
  };
}

export function createMockChatMessage(overrides = {}) {
  return {
    id: 1,
    role: 'user',
    content: 'How do I start a presentation?',
    created_at: '2025-01-01T00:00:00',
    ...overrides,
  };
}

export function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}
