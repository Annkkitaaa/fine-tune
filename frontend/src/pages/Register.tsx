import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  terms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterForm) => {
    console.log(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-100 dark:bg-dark-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-dark-800 rounded-2xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Create Account</h2>
          <p className="text-dark-500 dark:text-dark-400 mt-2">Sign up for a new account</p>
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
              placeholder="Create a password"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
              Confirm Password
            </label>
            <input
              {...register('confirmPassword')}
              type="password"
              className="w-full px-4 py-2 rounded-lg border border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 focus:ring-2 focus:ring-primary-500"
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              {...register('terms')}
              type="checkbox"
              className="rounded border-dark-200 dark:border-dark-700 text-primary-500 focus:ring-primary-500"
            />
            <label className="ml-2 text-sm">
              I agree to the{' '}
              <a href="#" className="text-primary-500 hover:text-primary-600">
                Terms and Conditions
              </a>
            </label>
          </div>
          {errors.terms && (
            <p className="text-sm text-red-500">{errors.terms.message}</p>
          )}

          <button
            type="submit"
            className="w-full py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            Create Account
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-500 hover:text-primary-600">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}