import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import api from '../services/api';

const verifySchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

type VerifyForm = z.infer<typeof verifySchema>;

export const Verify = () => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  // Retrieve the email passed securely from the Register page via router state
  const email = location.state?.email as string | undefined;

  useEffect(() => {
    if (!email) {
      // If we landed here without an email in state, redirect back to register
      navigate('/auth/register', { replace: true });
    }
  }, [email, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
  });

  const onSubmit = async (data: VerifyForm) => {
  if(!email) {
    console.log("No email found");
    return;
  }

  setIsLoading(true);
  setApiError(null);

  try {
    const response = await api.post('/auth/verify-otp', { email, otp: data.otp });

    console.log("API response", response);

    if (response.status === 200) {
       navigate('/auth/login', { replace: true });
    }

  } catch (error: any) {
    if (error.response?.data?.error) {
      setApiError(error.response.data.error);
    } else {
      setApiError('Invalid or expired OTP. Please try again.');
    }
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg border border-slate-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <ShieldCheck size={24} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Verify Email</h2>
          <p className="mt-2 text-sm text-slate-600">
            We sent a 6-digit code to <span className="font-semibold text-slate-900">{email}</span>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              id="otp"
              type="text"
              label="Verification Code"
              placeholder="123456"
              maxLength={6}
              className="text-center text-lg tracking-widest font-mono"
              error={errors.otp?.message}
              {...register('otp')}
            />
          </div>

          {apiError && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200 animate-in fade-in">
              <h3 className="text-sm font-medium text-red-800">{apiError}</h3>
            </div>
          )}

          <div>
            <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
              Verify Account
            </Button>
          </div>
          
          <div className="text-sm text-center">
             <span className="text-slate-600">Entered the wrong email? </span>
            <Link to="/auth/register" className="font-medium text-primary-600 hover:text-primary-500">
              Go back
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Verify;
