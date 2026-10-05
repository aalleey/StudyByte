import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema, RegisterFormValues } from '../../schemas/auth.schemas';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { useRegister } from '../../features/auth/useRegister';
import { useClasses } from '../../features/classes';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../lib/errors';

export function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });
  const registerMutation = useRegister();
  // /classes is public and returns published classes only.
  const { data: classes, isLoading: isLoadingClasses, isError: isClassesError } = useClasses();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const gradeOptions = (classes ?? []).map((cls) => ({ value: cls.id, label: cls.title }));

  async function onSubmit(values: RegisterFormValues) {
    try {
      await registerMutation.mutateAsync(values);
      showToast('Account created! Please sign in.', 'success');
      navigate('/login', { replace: true });
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not create account'), 'error');
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Create your student account</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Self-signup is for students only.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Input label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Select
          label="Grade"
          placeholder={
            isLoadingClasses
              ? 'Loading grades...'
              : isClassesError
                ? 'Could not load grades'
                : 'Select your grade'
          }
          defaultValue=""
          disabled={isLoadingClasses || isClassesError}
          options={gradeOptions}
          error={errors.classId?.message}
          {...register('classId')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" className="w-full" isLoading={registerMutation.isPending}>
          Create account
        </Button>
      </form>
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
          Sign in
        </Link>
      </p>
    </div>
  );
}
