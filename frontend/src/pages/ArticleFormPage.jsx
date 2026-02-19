import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { get, post, put } from '../api';
import { useAuth } from '../context/AuthContext';
import FlashMessage from '../components/FlashMessage';

export default function ArticleFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isEdit) {
      async function load() {
        const { res, data } = await get(`/api/articles/${id}`);
        if (res.ok) {
          setTitle(data.article.title);
          setDescription(data.article.description);
          setTags(data.article.tags.join(', '));
        }
      }
      load();
    }
  }, [id, isEdit, user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const body = { title, description, tags };
    const { res, data } = isEdit
      ? await put(`/api/articles/${id}`, body)
      : await post('/api/articles', body);
    if (res.ok) {
      navigate('/articles');
    } else {
      setError(data.error);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <h2>{isEdit ? 'Edit Article' : 'New Article'}</h2>
        <FlashMessage message={error} onDismiss={() => setError('')} />
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Title</label>
            <input
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows="5"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Tags (comma separated)</label>
            <input
              className="form-control"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            {isEdit ? 'Update' : 'Create'}
          </button>
        </form>
      </div>
    </div>
  );
}
