import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { forgotPasswordSchema, ForgotPasswordFormValues } from '../../schemas/auth.schemas';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useForgotPassword } from '../../features/auth/useForgotPassword';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/errors';

export function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });
  const forgotPasswordMutation = useForgotPassword();
  const { showToast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(values: ForgotPasswordFormValues) {
    try {
      await forgotPasswordMutation.mutateAsync(values.email);
      setSubmitted(true);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Check your inbox</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          If an account exists for that email, a password reset link has been sent (in Stage 1, it is also printed to the
          backend server console).
        </p>
        <Link to="/login" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Forgot your password?</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Button type="submit" className="w-full" isLoading={forgotPasswordMutation.isPending}>
          Send reset link
        </Button>
      </form>
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        <Link to="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
