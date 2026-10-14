import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BlogCard from '../components/BlogCard';
import Navbar from '../components/Navbar';
import StorageNotice from '../components/StorageNotice';
import {
  ACCENT_CLASSES,
  ROLES,
  ROUTES,
} from '../constants';
import { sortPostsNewestFirst } from '../utils/formatters';
import {
  getPosts,
  STORAGE_STATUS_CODES,
} from '../utils/storage';

export default function Home({ session, onLogout }) {
  const [posts, setPosts] = useState([]);
  const [diagnostic, setDiagnostic] = useState(null);
  const sortedPosts = sortPostsNewestFirst(posts);

  useEffect(() => {
    const result = getPosts();

    setPosts(result.value);
    setDiagnostic(result.diagnostic);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar onLogout={onLogout} session={session} />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-700">
                Your writing space
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Blogs
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Read and manage the latest posts saved in this browser.
              </p>
            </div>

            <Link
              className={`inline-flex min-h-11 items-center justify-center self-start rounded-lg px-5 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:self-auto ${ACCENT_CLASSES.primary}`}
              to={ROUTES.write}
            >
              Write a Post
            </Link>
          </div>

          <div className="mt-8">
            <StorageNotice diagnostic={diagnostic} />

            {diagnostic?.code ===
            STORAGE_STATUS_CODES.invalidStoredData ? (
              <div
                className={`rounded-lg border px-4 py-3 text-sm ${ACCENT_CLASSES.warning}`}
                role="status"
              >
                <p className="font-semibold">
                  Local post data could not be read
                </p>
                <p className="mt-1">{diagnostic.message}</p>
              </div>
            ) : null}
          </div>

          {sortedPosts.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sortedPosts.map((post, index) => (
                <BlogCard
                  index={index}
                  key={post.id}
                  post={post}
                  session={session}
                />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <h2 className="text-lg font-semibold text-slate-900">
                No posts yet.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Be the first to write a post in this browser-local
                space.
              </p>
              <Link
                className={`mt-6 inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${ACCENT_CLASSES.primary}`}
                to={ROUTES.write}
              >
                Write a Post
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

Home.propTypes = {
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.oneOf([ROLES.ADMIN, ROLES.USER]).isRequired,
  }).isRequired,
  onLogout: PropTypes.func.isRequired,
};