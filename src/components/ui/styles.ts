/** 共通の Tailwind クラス。見た目の一貫性をここで担保する */

export const inputClass =
  'w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 ' +
  'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:bg-gray-100 disabled:text-gray-400';

export const checkboxClass = 'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600';

export const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500';

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50';

export const buttonClass = {
  primary: `${buttonBase} bg-blue-600 text-white hover:bg-blue-700`,
  accent: `${buttonBase} bg-teal-700 text-white hover:bg-teal-600`,
  secondary: `${buttonBase} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`,
  ghost: `${buttonBase} text-gray-600 hover:bg-gray-100`,
} as const;

export const iconButtonClass =
  'inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition-colors ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';
