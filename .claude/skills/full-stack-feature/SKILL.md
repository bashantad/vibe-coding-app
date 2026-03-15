---
name: full-stack-feature
description: Scaffold a complete full-stack feature with backend route, frontend page, nav link, and tests. Use when asked to add a new feature or page to the application.
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(python3 -m pytest *), Bash(cd frontend && npm run test:run *)
---

# Full-Stack Feature Generator

Generate a complete full-stack feature for this Flask + React project based on the user's description: **$ARGUMENTS**

## Project Structure

This is a Flask backend + React (Vite) frontend app with these conventions:

### Backend (Python/Flask)
- Routes go in `routes/<feature>.py` as Flask Blueprints
- Blueprint pattern: `bp = Blueprint("<feature>", __name__, url_prefix="/api/<feature>")`
- Use `strict_slashes=False` on routes
- Use `@login_required` from `flask_login` for protected endpoints
- Return JSON responses: `jsonify({"key": value}), status_code`
- Register blueprint in `app.py` with `from routes.<feature> import bp as <feature>_bp` and `app.register_blueprint(<feature>_bp)`
- Models are in `models.py` using Flask-SQLAlchemy

### Frontend (React/Vite)
- Pages go in `frontend/src/pages/<Feature>Page.jsx`
- Tests go in `frontend/src/pages/__tests__/<Feature>Page.test.jsx`
- API calls use helpers from `frontend/src/api.js`: `get`, `post`, `put`, `del`
- Use React Bootstrap components: `Card`, `Button`, `Form`, `Badge`, `Spinner`, `Alert`, `Row`, `Col`, `ListGroup`
- Auth context available via `useAuth()` from `../context/AuthContext`
- Add route in `frontend/src/App.jsx`: `<Route path="/<feature>" element={<FeaturePage />} />`
- Add nav link in `frontend/src/components/Navbar.jsx` in the `me-auto` Nav section

### Tests
- Backend tests go in `tests/test_<feature>.py`
- Use `client` and `user` fixtures from `conftest.py`
- Use `unittest.mock.patch` for external API calls
- Frontend tests use `vitest` with `@testing-library/react`
- Mock API calls with `vi.mock('../../api')`
- Use test helpers from `../../test/helpers`: `renderWithProviders`, `createMockUser`, etc.
- Add mock data factories to `frontend/src/test/helpers.jsx`

## Steps

Follow these steps in order:

1. **Create the backend route** (`routes/<feature>.py`)
   - Define the Blueprint and endpoints
   - Add proper error handling and validation
   - If a new model is needed, add it to `models.py` and create a migration

2. **Register the blueprint** in `app.py`

3. **Create the frontend page** (`frontend/src/pages/<Feature>Page.jsx`)
   - Fetch data on mount using `useEffect` and API helpers
   - Show loading `Spinner` while fetching
   - Show `Alert` on errors
   - Use responsive Bootstrap grid layout

4. **Add the route** in `frontend/src/App.jsx`

5. **Add the nav link** in `frontend/src/components/Navbar.jsx`

6. **Create backend tests** (`tests/test_<feature>.py`)
   - At least 3-4 tests covering happy path, validation, and error cases

7. **Add mock data factory** to `frontend/src/test/helpers.jsx`
   - Follow the `createMock<Feature>` naming pattern

8. **Create frontend tests** (`frontend/src/pages/__tests__/<Feature>Page.test.jsx`)
   - At least 3-4 tests: loading state, data display, error handling, user interaction

9. **Run all tests** to verify nothing is broken
   - Backend: `python3 -m pytest tests/test_<feature>.py -v`
   - Frontend: `cd frontend && npm run test:run -- src/pages/__tests__/<Feature>Page.test.jsx`
