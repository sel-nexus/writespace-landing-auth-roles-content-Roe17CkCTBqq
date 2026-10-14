import { useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import StorageNotice from './components/StorageNotice';
import { ROLES, ROUTES } from './constants';
import AdminDashboard from './pages/AdminDashboard';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ReadBlog from './pages/ReadBlog';
import RegisterPage from './pages/RegisterPage';
import UserManagement from './pages/UserManagement';
import WriteBlog from './pages/WriteBlog';
import {
  clearSession,
  getSession,
  setSession,
} from './utils/auth';

export default function App() {
  const [authState, setAuthState] = useState(() => {
    const sessionResult = getSession();

    return {
      session: sessionResult.value,
      diagnostic: sessionResult.diagnostic,
    };
  });

  const { session, diagnostic } = authState;

  function handleLogin(nextSession) {
    const result = setSession(nextSession);

    if (!result.ok) {
      setAuthState((currentState) => ({
        ...currentState,
        diagnostic: result,
      }));
      return result;
    }

    setAuthState({
      session: nextSession,
      diagnostic: null,
    });

    return result;
  }

  function handleLogout() {
    const result = clearSession();

    if (!result.ok) {
      setAuthState((currentState) => ({
        ...currentState,
        diagnostic: result,
      }));
      return result;
    }

    setAuthState({
      session: null,
      diagnostic: null,
    });

    return result;
  }

  return (
    <BrowserRouter>
      <StorageNotice diagnostic={diagnostic} />

      <Routes>
        <Route
          element={<LandingPage session={session} />}
          path={ROUTES.landing}
        />
        <Route
          element={
            <LoginPage
              onLogin={handleLogin}
              session={session}
            />
          }
          path={ROUTES.login}
        />
        <Route
          element={
            <RegisterPage
              onRegister={handleLogin}
              session={session}
            />
          }
          path={ROUTES.register}
        />

        <Route element={<ProtectedRoute session={session} />}>
          <Route
            element={
              <Home
                onLogout={handleLogout}
                session={session}
              />
            }
            path={ROUTES.blogs}
          />
          <Route
            element={
              <ReadBlog
                onLogout={handleLogout}
                session={session}
              />
            }
            path={ROUTES.blog}
          />
          <Route
            element={
              <WriteBlog
                onLogout={handleLogout}
                session={session}
              />
            }
            path={ROUTES.write}
          />
          <Route
            element={
              <WriteBlog
                onLogout={handleLogout}
                session={session}
              />
            }
            path={ROUTES.edit}
          />

          <Route
            element={
              <ProtectedRoute
                role={ROLES.ADMIN}
                session={session}
              />
            }
          >
            <Route
              element={
                <AdminDashboard
                  onLogout={handleLogout}
                  session={session}
                />
              }
              path={ROUTES.admin}
            />
            <Route
              element={
                <UserManagement
                  onLogout={handleLogout}
                  session={session}
                />
              }
              path={ROUTES.users}
            />
          </Route>
        </Route>

        <Route
          element={<Navigate replace to={ROUTES.landing} />}
          path="*"
        />
      </Routes>
    </BrowserRouter>
  );
}