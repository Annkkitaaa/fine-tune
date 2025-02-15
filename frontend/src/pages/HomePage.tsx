import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Database, BarChart2, Rocket, GitBranch, LineChart } from 'lucide-react';

export const HomePage: React.FC = () => {
  const features = [
    {
      name: 'Models',
      description: 'Create, manage, and version your machine learning models',
      icon: Brain,
      href: '/models',
    },
    {
      name: 'Datasets',
      description: 'Upload, preprocess, and manage your training data',
      icon: Database,
      href: '/datasets',
    },
    {
      name: 'Training',
      description: 'Train models with advanced hyperparameter configuration',
      icon: BarChart2,
      href: '/training',
    },
    {
      name: 'Deployment',
      description: 'Deploy models to production with monitoring and scaling',
      icon: Rocket,
      href: '/deployment',
    },
    {
      name: 'Pipeline',
      description: 'Build end-to-end ML pipelines with automated workflows',
      icon: GitBranch,
      href: '/pipeline',
    },
    {
      name: 'Evaluation',
      description: 'Evaluate model performance with comprehensive metrics',
      icon: LineChart,
      href: '/evaluation',
    },
  ];

  return (
    <div className="py-12">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Welcome to ML Platform
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          A modern platform for machine learning model management, training, and deployment
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link
              key={feature.name}
              to={feature.href}
              className="group relative bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                    <Icon size={24} />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                    {feature.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                </div>
              </div>
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="text-blue-600 dark:text-blue-400">→</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};