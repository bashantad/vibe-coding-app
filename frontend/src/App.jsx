import { Routes, Route } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import AppNavbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import TodosPage from './pages/TodosPage';
import ProfilePage from './pages/ProfilePage';
import ArticlesPage from './pages/ArticlesPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import ArticleFormPage from './pages/ArticleFormPage';

export default function App() {
  return (
    <>
      <AppNavbar />
      <Container className="mt-4">
        <Routes>
          <Route path="/" element={<TodosPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/articles/new" element={<ArticleFormPage />} />
          <Route path="/articles/edit/:id" element={<ArticleFormPage />} />
          <Route path="/articles/:id" element={<ArticleDetailPage />} />
        </Routes>
      </Container>
    </>
  );
}
