export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4 mx-auto animate-pulse">
          <span className="text-white font-bold text-xl">T</span>
        </div>
        <h2 className="text-2xl font-bold gradient-text mb-2">TokenTracker</h2>
        <p className="text-gray-400">Loading your portfolio...</p>
        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
        </div>
      </div>
    </div>
  );
}
