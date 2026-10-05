import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPasswordSchema, ResetPasswordFormValues } from '../../schemas/auth.schemas';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useResetPassword } from '../../features/auth/useResetPassword';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/errors';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });
  const resetPasswordMutation = useResetPassword();
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function onSubmit(values: ResetPasswordFormValues) {
    try {
      await resetPasswordMutation.mutateAsync({ token, password: values.password });
      showToast('Password reset successfully, please sign in.', 'success');
      navigate('/login', { replace: true });
    } catch (err) {
      showToast(getErrorMessage(err, 'This reset link is invalid or has expired'), 'error');
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Invalid link</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          This reset link is missing a token. Please request a new one.
        </p>
        <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Reset your password</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Choose a new password for your account.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" className="w-full" isLoading={resetPasswordMutation.isPending}>
          Reset password
        </Button>
      </form>
    </div>
  );
}
