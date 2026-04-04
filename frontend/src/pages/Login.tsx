import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Login = () => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
    const response = await api.post('/auth/login', data);

    const { user, token } = response.data;

    if (!user || !token) {
      throw new Error('Invalid email or password. Please try again.');
    }

    login(user, token);

    // Redirect to home/search by default, or specific redirect if provided
    const redirectTo = searchParams.get('redirect') || '/';
    const pendingQuery = searchParams.get('q');
    
    // If there's a pending query, always go to home (search page)
    const finalUrl = pendingQuery ? `/?q=${encodeURIComponent(pendingQuery)}` : redirectTo;
    navigate(finalUrl);

  } catch (error: any) {
    if (error.response?.data?.message) {
      setApiError(error.response.data.message);
    } else {
      setApiError('Invalid email or password. Please try again.');
    }
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <LogIn size={24} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Sign in to SkillSync</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
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

          <div className="flex justify-end -mt-1">
            <Link
              to="/auth/forgot-password"
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Forgot password?
            </Link>
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
             <span className="text-slate-600 dark:text-slate-400">Don't have an account? </span>
            <Link to="/auth/register" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500">
              Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
