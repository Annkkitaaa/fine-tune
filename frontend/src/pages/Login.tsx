import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    console.log(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-100 dark:bg-dark-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-dark-800 rounded-2xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Welcome Back</h2>
          <p className="text-dark-500 dark:text-dark-400 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-4 py-2 rounded-lg border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 focus:ring-2 focus:ring-primary-500"
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              className="w-full px-4 py-2 rounded-lg border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 focus:ring-2 focus:ring-primary-500"
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                {...register('rememberMe')}
                type="checkbox"
                className="rounded border-dark-200 dark:border-dark-700 text-primary-500 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm">Remember me</span>
            </label>
            <a href="#" className="text-sm text-primary-500 hover:text-primary-600">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            Sign In
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-500 hover:text-primary-600">
              Sign up
            </Link>
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dark-200 dark:border-dark-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-dark-800 text-dark-500">
              Or continue with
            </span>
          </div>
        </div>

        <button
          type="button"
          className="w-full py-2 px-4 bg-dark-100 dark:bg-dark-700 hover:bg-dark-200 dark:hover:bg-dark-600 rounded-lg transition-colors"
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
}