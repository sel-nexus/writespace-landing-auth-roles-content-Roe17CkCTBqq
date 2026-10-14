import PropTypes from 'prop-types';
import { Navigate, Outlet } from 'react-router-dom';
import { ROLES, ROUTES } from '../constants';

export default function ProtectedRoute({
  session,
  role,
  children,
}) {
  if (session === null || typeof session !== 'object') {
    return <Navigate replace to={ROUTES.login} />;
  }

  if (role === ROLES.ADMIN && session.role !== ROLES.ADMIN) {
    return <Navigate replace to={ROUTES.blogs} />;
  }

  return children === undefined ? <Outlet /> : children;
}

ProtectedRoute.propTypes = {
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.oneOf([ROLES.ADMIN, ROLES.USER]).isRequired,
  }),
  role: PropTypes.oneOf([ROLES.ADMIN]),
  children: PropTypes.node,
};