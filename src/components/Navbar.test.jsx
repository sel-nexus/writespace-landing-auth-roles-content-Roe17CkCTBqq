import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ROLES } from '../constants';
import Navbar from './Navbar';

function createSession(overrides = {}) {
  return {
    userId: 'user-1',
    username: 'demo_user',
    displayName: 'Demo User',
    role: ROLES.USER,
    ...overrides,
  };
}

function renderNavbar({
  route = '/blogs',
  session = createSession(),
  onLogout = vi.fn(() => ({ ok: true })),
} = {}) {
  return {
    onLogout,
    ...render(
      <MemoryRouter initialEntries={[route]}>
        <Navbar onLogout={onLogout} session={session} />
      </MemoryRouter>,
    ),
  };
}

describe('Navbar', () => {
  it('renders user navigation links and marks the current route with a text-accessible state', () => {
    renderNavbar({ route: '/edit/post-1' });

    expect(
      screen.getByRole('link', { name: 'My Blogs' }),
    ).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Write' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.queryByRole('link', { name: 'Dashboard' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Users' }),
    ).not.toBeInTheDocument();
  });

  it('renders Admin-specific links and treats a blog reader route as active Blogs navigation', () => {
    renderNavbar({
      route: '/blog/post-1',
      session: createSession({
        userId: 'admin',
        username: 'admin',
        displayName: 'Admin',
        role: ROLES.ADMIN,
      }),
    });

    expect(
      screen.getByRole('link', { name: 'Dashboard' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Blogs' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('link', { name: 'Write' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Users' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'My Blogs' }),
    ).not.toBeInTheDocument();
  });

  it('exposes a labelled role-specific avatar in the account trigger', () => {
    renderNavbar();

    const accountButton = screen.getByRole('button', {
      name: 'Demo User account menu',
    });

    expect(accountButton).toHaveAttribute('aria-haspopup', 'menu');
    expect(accountButton).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.getByRole('img', { name: 'Demo User, User' }),
    ).toBeInTheDocument();
  });

  it('opens and closes the hamburger menu with keyboard activation and updates aria-expanded', async () => {
    const user = userEvent.setup();
    renderNavbar();

    const menuButton = screen.getByRole('button', {
      name: 'Open navigation menu',
    });

    menuButton.focus();
    await user.keyboard('{Enter}');

    expect(
      screen.getByRole('button', {
        name: 'Close navigation menu',
      }),
    ).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getAllByRole('link', { name: 'My Blogs' }),
    ).toHaveLength(2);

    await user.keyboard(' ');

    expect(
      screen.getByRole('button', {
        name: 'Open navigation menu',
      }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('dismisses the mobile menu with Escape and restores focus to its trigger', async () => {
    const user = userEvent.setup();
    renderNavbar();

    const menuButton = screen.getByRole('button', {
      name: 'Open navigation menu',
    });

    await user.click(menuButton);

    const openMenuButton = screen.getByRole('button', {
      name: 'Close navigation menu',
    });
    expect(openMenuButton).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Escape}');

    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton).toHaveFocus();
  });

  it('updates account aria-expanded and restores account trigger focus after Escape', async () => {
    const user = userEvent.setup();
    renderNavbar();

    const accountButton = screen.getByRole('button', {
      name: 'Demo User account menu',
    });

    accountButton.focus();
    await user.keyboard('{Enter}');

    expect(accountButton).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByRole('menu', { name: 'Account menu' }),
    ).toBeInTheDocument();
    expect(screen.getByText('@demo_user')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(accountButton).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByRole('menu', { name: 'Account menu' }),
    ).not.toBeInTheDocument();
    expect(accountButton).toHaveFocus();
  });

  it('calls the logout callback and closes the account menu after successful logout', async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn(() => Promise.resolve({ ok: true }));
    renderNavbar({ onLogout });

    const accountButton = screen.getByRole('button', {
      name: 'Demo User account menu',
    });
    await user.click(accountButton);
    await user.click(screen.getByRole('menuitem', { name: 'Log out' }));

    expect(onLogout).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(accountButton).toHaveAttribute('aria-expanded', 'false');
      expect(
        screen.queryByRole('menu', { name: 'Account menu' }),
      ).not.toBeInTheDocument();
    });
  });

  it('keeps the account menu open and displays an alert when logout fails', async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn(() =>
      Promise.resolve({
        ok: false,
        message: 'Browser-local logout could not be saved.',
      }),
    );
    renderNavbar({ onLogout });

    const accountButton = screen.getByRole('button', {
      name: 'Demo User account menu',
    });
    await user.click(accountButton);
    await user.click(screen.getByRole('menuitem', { name: 'Log out' }));

    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Browser-local logout could not be saved.',
    );
    expect(accountButton).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByRole('menu', { name: 'Account menu' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Log out' }),
    ).toBeEnabled();
  });
});