'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center glass-card p-8 max-w-md mx-4">
        <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
          <span className="text-white font-bold text-xl">!</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">
          Something went wrong!
        </h2>
        <p className="text-gray-400 mb-6">
          We encountered an error while loading TokenTracker. Please try again.
        </p>
        <button
          onClick={reset}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
