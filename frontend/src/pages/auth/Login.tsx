import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Mail, Lock } from 'lucide-react';

interface LoginForm {
  email: string;
  password: string;
}

export function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    // TODO: Implement login logic
    console.log(data);
    setIsLoading(false);
  };

  return (
    <div className="rounded-lg bg-white/80 p-8 shadow-lg backdrop-blur-sm dark:bg-primary-dark/80">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary-dark dark:text-primary-light">
            Welcome Back
          </h1>
          <p className="text-sm text-tertiary">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-tertiary" />
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                className="w-full rounded-md border border-secondary-light bg-transparent py-2 pl-10 pr-3 text-sm placeholder:text-tertiary focus:border-primary-dark focus:outline-none focus:ring-1 focus:ring-primary-dark dark:border-secondary-dark dark:focus:border-primary-light dark:focus:ring-primary-light"
                placeholder="Email"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-tertiary" />
              <input
                {...register('password', {
                  required: 'Password is required',
                })}
                type="password"
                className="w-full rounded-md border border-secondary-light bg-transparent py-2 pl-10 pr-3 text-sm placeholder:text-tertiary focus:border-primary-dark focus:outline-none focus:ring-1 focus:ring-primary-dark dark:border-secondary-dark dark:focus:border-primary-light dark:focus:ring-primary-light"
                placeholder="Password"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-sm text-tertiary">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-primary-dark hover:underline dark:text-primary-light"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}