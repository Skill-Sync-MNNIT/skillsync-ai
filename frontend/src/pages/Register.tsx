import { useState } from 'react';
import { useForm } from 'react-hook-form';  
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import api from '../services/api';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address').refine(e => e.endsWith('@mnnit.ac.in') || !e.includes('mnnit'), { message: "Students must use @mnnit.ac.in. Alumni/Profs can use any valid email if approved."}),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.string().refine((val) => ['student', 'professor', 'alumni'].includes(val), {
    message: 'Please select a valid role',
  }),
});

type RegisterForm = z.infer<typeof registerSchema>;

export const Register = () => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'student',
    }
  });

  const onSubmit = async (data: RegisterForm) => {
  setIsLoading(true);
  setApiError(null);

  try {
      await api.post('/auth/register', data);

      navigate('/auth/verify-otp', { state: { email: data.email } });
    } catch (err: any) {
      if (err.response?.data?.message) {
        setApiError(err.response.data.message);
      } else if (err.response?.data?.error) {
        setApiError(err.response.data.error);
      } else {
        setApiError(err.message || "Registration failed");
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
            <UserPlus size={24} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Create Account</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Join the MNNIT academic talent network
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              id="email"
              type="email"
              label="Email Address"
              placeholder="student@mnnit.ac.in"
              error={errors.email?.message}
              {...register('email')}
            />
            
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                I am a...
              </label>
              <select
                id="role"
                className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                {...register('role')}
              >
                <option value="student">Student</option>
                <option value="alumni">Alumni</option>
                <option value="professor">Professor</option>
              </select>
              {errors.role && <p className="mt-1 text-sm text-red-500">{errors.role.message}</p>}
            </div>

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
              <h3 className="text-sm font-medium text-red-800">{apiError}</h3>
            </div>
          )}

          <div>
            <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
              Sign Up
            </Button>
          </div>
          
          <div className="text-sm text-center">
             <span className="text-slate-600 dark:text-slate-400">Already have an account? </span>
            <Link to="/auth/login" className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
