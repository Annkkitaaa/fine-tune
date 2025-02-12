import { BrainCircuit } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <BrainCircuit className="h-6 w-6 text-primary-dark dark:text-primary-light" />
      <span className="text-xl font-bold text-primary-dark dark:text-primary-light">
        Fine Tuning Labs
      </span>
    </div>
  );
}