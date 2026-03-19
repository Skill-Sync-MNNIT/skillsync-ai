import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Login = () => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setApiError(null);
    try {
      // TODO: MOCK — Replace with real API call when backend is ready
      // const response = await api.post('/auth/login', data);
      await new Promise(resolve => setTimeout(resolve, 500)); // simulate network delay

      const mockUser = {
        _id: 'mock-user-001',
        email: data.email,
        role: 'student' as const,
        isVerified: true,
        isActive: true,
      };
      const mockToken = 'mock-jwt-token-for-dev';

      login(mockUser, mockToken);
      navigate('/dashboard');
    } catch {
      setApiError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg border border-slate-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <LogIn size={24} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Sign in to SkillSync</h2>
          <p className="mt-2 text-sm text-slate-600">
            Exclusive academic networking for MNNIT
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 rounded-md shadow-sm">
            <Input
              id="email"
              type="email"
              label="Email Address"
              placeholder="student@mnnit.ac.in"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          {apiError && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200 animate-in fade-in">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{apiError}</h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
              Sign In
            </Button>
          </div>
          
          <div className="text-sm text-center">
             <span className="text-slate-600">Don't have an account? </span>
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
