import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { pushMock, refreshMock, signInWithPasswordMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
  signInWithPasswordMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signInWithPassword: signInWithPasswordMock },
  }),
}));

import LoginPage from '@/app/login/page';

describe('LoginPage', () => {
  beforeEach(() => {
    pushMock.mockReset();
    refreshMock.mockReset();
    signInWithPasswordMock.mockReset();
  });

  it('renders email and password fields', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('signs in and redirects to /dashboard on success', async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'ca@example.com');
    await user.type(screen.getByLabelText('Password'), 'hunter2');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(signInWithPasswordMock).toHaveBeenCalledWith({
        email: 'ca@example.com',
        password: 'hunter2',
      });
    });
    expect(pushMock).toHaveBeenCalledWith('/dashboard');
    expect(refreshMock).toHaveBeenCalled();
  });

  it('shows the error message and does not redirect on failure', async () => {
    signInWithPasswordMock.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText('Email'), 'ca@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText('Invalid login credentials')).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
