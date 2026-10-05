import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginSchema, LoginFormValues } from '../../schemas/auth.schemas';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useLogin } from '../../features/auth/useLogin';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/errors';

export function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });
  const loginMutation = useLogin();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  async function onSubmit(values: LoginFormValues) {
    try {
      const user = await loginMutation.mutateAsync(values);
      showToast(`Welcome back, ${user.name}`, 'success');
      const redirectTo = (location.state as { from?: Location })?.from?.pathname;
      // SUPERADMIN defaults to the admin dashboard; they switch into the
      // student view explicitly via the Topbar view switcher.
      navigate(redirectTo ?? (user.role === 'STUDENT' ? '/student' : '/admin'), { replace: true });
    } catch (err) {
      showToast(getErrorMessage(err, 'Invalid email or password'), 'error');
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Sign in</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back, please enter your details.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" isLoading={loginMutation.isPending}>
          Sign in
        </Button>
      </form>
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
          Register
        </Link>
      </p>
    </div>
  );
}
