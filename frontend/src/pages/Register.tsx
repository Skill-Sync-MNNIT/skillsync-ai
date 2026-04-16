import { useState } from 'react';
import { useForm } from 'react-hook-form';  
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address').refine(e => e.endsWith('@mnnit.ac.in') || !e.includes('mnnit'), { message: "Students must use @mnnit.ac.in. Alumni/Profs can use any valid email if approved." }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.string().refine((val) => ['student', 'professor', 'alumni'].includes(val), {
    message: 'Please select a valid role',
  }),
});

type RegisterForm = z.infer<typeof registerSchema>;

const roleOptions = [
  { label: 'Student', value: 'student' },
  { label: 'Alumni', value: 'alumni' },
  { label: 'Professor', value: 'professor' },
];

export const Register = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'student',
    }
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterForm) => {
  setIsLoading(true);

  try {
      const response = await api.post('/auth/register', data);
      toast(response.data.message || 'Verification code sent to your email!', 'success');
      navigate('/auth/verify-otp', { state: { email: data.email } });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Registration failed";
      toast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50/50 dark:bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-bg-surface-lowest dark:bg-slate-800/90 p-6 sm:p-10 rounded-2xl ambient-shadow ghost-border-visible">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full flex items-center justify-center mb-4 shadow-inner ring-1 ring-primary-200/50 dark:ring-primary-800/50">
            <UserPlus size={24} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Create Account</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Join the MNNIT academic talent network
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              id="email"
              type="email"
              label="Email Address"
              placeholder="student@mnnit.ac.in"
              error={errors.email?.message}
              {...register('email')}
            />

            <Select
              label="I am a..."
              value={selectedRole}
              onChange={(val) => setValue('role', val, { shouldValidate: true })}
              options={roleOptions}
              error={errors.role?.message}
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

          <div>
            <Button type="submit" className="w-full btn-gradient" isLoading={isLoading} size="lg">
              Sign Up
            </Button>
          </div>
          
          <div className="text-sm text-center">
            <span className="text-slate-500 dark:text-slate-400">Already have an account? </span>
            <Link to="/auth/login" className="font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
