import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { pushMock, refreshMock, signUpMock, apiPostMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
  signUpMock: vi.fn(),
  apiPostMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: { signUp: signUpMock },
  }),
}));

vi.mock('@/lib/api', () => ({
  api: { post: apiPostMock },
}));

import SignupPage from '@/app/signup/page';

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Firm name'), 'Sharma & Associates');
  await user.type(screen.getByLabelText('Your name'), 'Asha Sharma');
  await user.type(screen.getByLabelText('Email'), 'asha@example.com');
  await user.type(screen.getByLabelText('Password'), 'hunter22');
  await user.click(screen.getByRole('button', { name: /create account/i }));
}

describe('SignupPage', () => {
  beforeEach(() => {
    pushMock.mockReset();
    refreshMock.mockReset();
    signUpMock.mockReset();
    apiPostMock.mockReset();
  });

  it('renders firm, name, email and password fields', () => {
    render(<SignupPage />);
    expect(screen.getByLabelText('Firm name')).toBeInTheDocument();
    expect(screen.getByLabelText('Your name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('syncs the profile and redirects to /dashboard when a session is returned', async () => {
    signUpMock.mockResolvedValue({ data: { session: {} }, error: null });
    apiPostMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<SignupPage />);

    await fillForm(user);

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledWith('/api/profile/sync', {
        firmName: 'Sharma & Associates',
        fullName: 'Asha Sharma',
      });
    });
    expect(pushMock).toHaveBeenCalledWith('/dashboard');
  });

  it('redirects to /login without syncing when no session is returned (email confirmation required)', async () => {
    signUpMock.mockResolvedValue({ data: { session: null }, error: null });
    const user = userEvent.setup();
    render(<SignupPage />);

    await fillForm(user);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/login'));
    expect(apiPostMock).not.toHaveBeenCalled();
  });

  it('shows an error message when sign-up fails', async () => {
    signUpMock.mockResolvedValue({
      data: { session: null },
      error: { message: 'User already registered' },
    });
    const user = userEvent.setup();
    render(<SignupPage />);

    await fillForm(user);

    expect(await screen.findByText('User already registered')).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
