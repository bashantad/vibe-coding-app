import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import ArticleFormPage from '../ArticleFormPage';
import { renderWithProviders, createMockUser, createMockArticle, LocationDisplay } from '../../test/helpers';
import { get, post, put } from '../../api';

vi.mock('../../api');

describe('ArticleFormPage', () => {
  it('redirects to /login when not authenticated', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/articles/new" element={<ArticleFormPage />} />
        <Route path="/login" element={<LocationDisplay />} />
      </Routes>,
      { route: '/articles/new' }
    );

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/login');
    });
  });

  it('shows "New Article" heading in create mode', async () => {
    renderWithProviders(<ArticleFormPage />, {
      user: createMockUser(),
    });
    expect(screen.getByText('New Article')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('shows "Edit Article" heading and pre-fills form in edit mode', async () => {
    const article = createMockArticle({
      title: 'Existing Title',
      description: 'Existing desc',
      tags: ['tag1', 'tag2'],
    });
    get.mockResolvedValue({ res: { ok: true }, data: { article } });

    renderWithProviders(<ArticleFormPage />, {
      route: '/articles/edit/1',
      routePath: '/articles/edit/:id',
      user: createMockUser(),
    });

    await waitFor(() => {
      expect(screen.getByText('Edit Article')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing Title')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing desc')).toBeInTheDocument();
      expect(screen.getByDisplayValue('tag1, tag2')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
  });

  it('creates article and navigates to /articles on success', async () => {
    post.mockResolvedValue({ res: { ok: true }, data: {} });
    renderWithProviders(
      <Routes>
        <Route path="/articles/new" element={<ArticleFormPage />} />
        <Route path="/articles" element={<LocationDisplay />} />
      </Routes>,
      { route: '/articles/new', user: createMockUser() }
    );

    await userEvent.type(screen.getByLabelText('Title'), 'New Post');
    await userEvent.type(screen.getByLabelText('Description'), 'Content here');
    await userEvent.type(screen.getByLabelText('Tags (comma separated)'), 'a,b');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith('/api/articles', {
        title: 'New Post',
        description: 'Content here',
        tags: 'a,b',
      });
      expect(screen.getByTestId('location')).toHaveTextContent('/articles');
    });
  });

  it('updates article via PUT in edit mode', async () => {
    const article = createMockArticle({ title: 'Old', description: 'Old desc', tags: ['old'] });
    get.mockResolvedValue({ res: { ok: true }, data: { article } });
    put.mockResolvedValue({ res: { ok: true }, data: {} });

    renderWithProviders(
      <Routes>
        <Route path="/articles/edit/:id" element={<ArticleFormPage />} />
        <Route path="/articles" element={<LocationDisplay />} />
      </Routes>,
      { route: '/articles/edit/1', user: createMockUser() }
    );

    await waitFor(() => expect(screen.getByDisplayValue('Old')).toBeInTheDocument());

    await userEvent.clear(screen.getByLabelText('Title'));
    await userEvent.type(screen.getByLabelText('Title'), 'Updated');
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => {
      expect(put).toHaveBeenCalledWith('/api/articles/1', expect.objectContaining({
        title: 'Updated',
      }));
      expect(screen.getByTestId('location')).toHaveTextContent('/articles');
    });
  });

  it('shows error on failed create', async () => {
    post.mockResolvedValue({ res: { ok: false }, data: { error: 'Title required' } });
    renderWithProviders(<ArticleFormPage />, { user: createMockUser() });

    await userEvent.type(screen.getByLabelText('Title'), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('Title required')).toBeInTheDocument();
    });
  });
});
