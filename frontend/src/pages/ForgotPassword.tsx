import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Mail, ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import api from '../services/api';

// ─── Step 1: Email schema ───────────────────────────────────────────────
const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

// ─── Step 2: OTP schema ────────────────────────────────────────────────
const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

// ─── Step 3: New password schema ────────────────────────────────────────
const resetSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type EmailForm = z.infer<typeof emailSchema>;
type OTPForm = z.infer<typeof otpSchema>;
type ResetForm = z.infer<typeof resetSchema>;

type Step = 1 | 2 | 3;

// ─── Step Indicator ─────────────────────────────────────────────────────
const StepIndicator = ({ currentStep }: { currentStep: Step }) => {
  const steps = [
    { num: 1, label: 'Email' },
    { num: 2, label: 'Verify' },
    { num: 3, label: 'Reset' },
  ];

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center gap-2">
          <div
            className={`
              flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all duration-300
              ${currentStep >= step.num
                ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                : 'bg-slate-100 text-slate-400'
              }
            `}
          >
            {currentStep > step.num ? (
              <CheckCircle2 size={16} />
            ) : (
              step.num
            )}
          </div>
          <span
            className={`text-xs font-medium transition-colors duration-300 ${
              currentStep >= step.num ? 'text-primary-600' : 'text-slate-400'
            }`}
          >
            {step.label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`w-8 h-0.5 rounded-full transition-colors duration-500 ${
                currentStep > step.num ? 'bg-primary-500' : 'bg-slate-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────
export const ForgotPassword = () => {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1 form
  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  });

  // Step 2 form
  const otpForm = useForm<OTPForm>({
    resolver: zodResolver(otpSchema),
  });

  // Step 3 form
  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  // ─── Step 1: Request OTP ────────────────────────────────────────────
  const handleEmailSubmit = async (data: EmailForm) => {
    setIsLoading(true);
    setApiError(null);
    setSuccessMessage(null);

    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setEmail(data.email);
      setSuccessMessage('A 6-digit reset code has been sent to your email.');
      setStep(2);
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step 2: Verify OTP ─────────────────────────────────────────────
  const handleOTPSubmit = async (data: OTPForm) => {
    setIsLoading(true);
    setApiError(null);
    setSuccessMessage(null);

    try {
      await api.post('/auth/verify-reset-otp', { email, otp: data.otp });
      setOtp(data.otp);
      setSuccessMessage('Code verified! Set your new password below.');
      setStep(3);
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Invalid or expired code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step 3: Reset Password ─────────────────────────────────────────
  const handleResetSubmit = async (data: ResetForm) => {
    setIsLoading(true);
    setApiError(null);
    setSuccessMessage(null);

    try {
      await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword: data.password,
      });
      setSuccessMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/auth/login', { replace: true }), 2000);
    } catch (error: any) {
      setApiError(error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step icon + heading ────────────────────────────────────────────
  const stepConfig = {
    1: {
      icon: <Mail size={24} />,
      iconBg: 'bg-primary-100 text-primary-600',
      title: 'Forgot Password?',
      subtitle: 'Enter the email address associated with your account.',
    },
    2: {
      icon: <ShieldCheck size={24} />,
      iconBg: 'bg-amber-100 text-amber-600',
      title: 'Enter Verification Code',
      subtitle: (
        <>
          We sent a 6-digit code to <span className="font-semibold text-slate-900">{email}</span>
        </>
      ),
    },
    3: {
      icon: <KeyRound size={24} />,
      iconBg: 'bg-emerald-100 text-emerald-600',
      title: 'Set New Password',
      subtitle: 'Create a strong password for your account.',
    },
  };

  const current = stepConfig[step];

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-xl shadow-lg border border-slate-100">
        
        {/* Step Indicator */}
        <StepIndicator currentStep={step} />

        {/* Header */}
        <div className="text-center animate-fade-in-up" key={step}>
          <div className={`mx-auto h-12 w-12 ${current.iconBg} rounded-full flex items-center justify-center mb-4 shadow-inner`}>
            {current.icon}
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">{current.title}</h2>
          <p className="mt-2 text-sm text-slate-600">{current.subtitle}</p>
        </div>

        {/* Success banner */}
        {successMessage && (
          <div className="rounded-md bg-emerald-50 p-4 border border-emerald-200 animate-fade-in">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-sm font-medium text-emerald-800">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error banner */}
        {apiError && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200 animate-fade-in">
            <h3 className="text-sm font-medium text-red-800">{apiError}</h3>
          </div>
        )}

        {/* ─── Step 1: Email Form ─────────────────────────────────────── */}
        {step === 1 && (
          <form className="space-y-5" onSubmit={emailForm.handleSubmit(handleEmailSubmit)}>
            <Input
              id="reset-email"
              type="email"
              label="Email Address"
              placeholder="student@mnnit.ac.in"
              error={emailForm.formState.errors.email?.message}
              {...emailForm.register('email')}
            />
            <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
              Send Reset Code
            </Button>
          </form>
        )}

        {/* ─── Step 2: OTP Form ───────────────────────────────────────── */}
        {step === 2 && (
          <form className="space-y-5" onSubmit={otpForm.handleSubmit(handleOTPSubmit)}>
            <Input
              id="reset-otp"
              type="text"
              label="Verification Code"
              placeholder="123456"
              maxLength={6}
              className="text-center text-lg tracking-widest font-mono"
              error={otpForm.formState.errors.otp?.message}
              {...otpForm.register('otp')}
            />
            <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
              Verify Code
            </Button>
            <button
              type="button"
              onClick={() => { setStep(1); setApiError(null); setSuccessMessage(null); }}
              className="w-full flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft size={14} />
              Use a different email
            </button>
          </form>
        )}

        {/* ─── Step 3: Reset Password Form ────────────────────────────── */}
        {step === 3 && (
          <form className="space-y-5" onSubmit={resetForm.handleSubmit(handleResetSubmit)}>
            <Input
              id="new-password"
              type="password"
              label="New Password"
              placeholder="••••••••"
              error={resetForm.formState.errors.password?.message}
              {...resetForm.register('password')}
            />
            <Input
              id="confirm-password"
              type="password"
              label="Confirm Password"
              placeholder="••••••••"
              error={resetForm.formState.errors.confirmPassword?.message}
              {...resetForm.register('confirmPassword')}
            />
            <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
              Reset Password
            </Button>
          </form>
        )}

        {/* Bottom link */}
        <div className="text-sm text-center pt-2">
          <span className="text-slate-600">Remember your password? </span>
          <Link to="/auth/login" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
