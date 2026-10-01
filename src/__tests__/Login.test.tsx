import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../auth';
import Login from '../components/Login';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login form', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByText('AFES')).toBeInTheDocument();
    expect(screen.getByText('Anonymous Faculty Evaluation System')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should display demo credentials', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByText(/Demo Credentials/i)).toBeInTheDocument();
    expect(screen.getByText(/admin \/ admin/i)).toBeInTheDocument();
    expect(screen.getByText(/faculty \/ faculty/i)).toBeInTheDocument();
    expect(screen.getByText(/C24-001 \/ pass123/i)).toBeInTheDocument();
    expect(screen.getByText(/M001 \/ dean123/i)).toBeInTheDocument();
  });

  it('should allow typing in username field', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);
    
    const usernameInput = screen.getByPlaceholderText('Enter username');
    await user.type(usernameInput, 'testuser');
    
    expect(usernameInput).toHaveValue('testuser');
  });

  it('should allow typing in password field', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);
    
    const passwordInput = screen.getByPlaceholderText('Enter password');
    await user.type(passwordInput, 'testpass');
    
    expect(passwordInput).toHaveValue('testpass');
  });

  it('should show error for invalid credentials', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);
    
    const usernameInput = screen.getByPlaceholderText('Enter username');
    const passwordInput = screen.getByPlaceholderText('Enter password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(usernameInput, 'invalid');
    await user.type(passwordInput, 'wrongpass');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('should disable submit button while loading', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);
    
    const usernameInput = screen.getByPlaceholderText('Enter username');
    const passwordInput = screen.getByPlaceholderText('Enter password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'admin');
    await user.click(submitButton);
    
    // Button should be disabled during authentication
    expect(submitButton).toBeDisabled();
  });

  it('should have secure login section', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByText(/Secure Login/i)).toBeInTheDocument();
  });

  it('should display active period banner when cycle is active', async () => {
    renderWithProviders(<Login />);
    
    await waitFor(() => {
      expect(screen.getByText(/Current Active Period/i)).toBeInTheDocument();
    });
  });

  it('should require both username and password', () => {
    renderWithProviders(<Login />);
    
    const usernameInput = screen.getByPlaceholderText('Enter username');
    const passwordInput = screen.getByPlaceholderText('Enter password');
    
    expect(usernameInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  it('should have password field with correct type', () => {
    renderWithProviders(<Login />);
    
    const passwordInput = screen.getByPlaceholderText('Enter password');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
