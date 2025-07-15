export default function RecommendationsPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">AI Recommendations</h1>
          <p className="text-gray-400">Personalized content suggestions powered by AI</p>
        </div>
        
        {/* Placeholder content */}
        <div className="grid gap-6">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-lg border border-blue-500/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">AI Analysis Active</h2>
                <p className="text-sm text-gray-400">Analyzing your reading patterns...</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Recommended for You</h2>
            <div className="space-y-4">
              <div className="border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
                <h3 className="font-medium text-white mb-1">The Future of Neural Networks</h3>
                <p className="text-sm text-gray-400 mb-2">MIT Technology Review · 5 min read</p>
                <p className="text-gray-300 text-sm">Based on your interest in AI development and machine learning...</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">AI</span>
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">Research</span>
                  <span className="text-xs text-gray-500">95% match</span>
                </div>
              </div>
              
              <div className="border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
                <h3 className="font-medium text-white mb-1">Breakthrough in Quantum Error Correction</h3>
                <p className="text-sm text-gray-400 mb-2">Nature · 8 min read</p>
                <p className="text-gray-300 text-sm">Related to articles you've saved about quantum computing...</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Quantum</span>
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">Research</span>
                  <span className="text-xs text-gray-500">92% match</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Topics to Explore</h2>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors">
                Edge Computing
              </button>
              <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors">
                Sustainable Tech
              </button>
              <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors">
                Bioengineering
              </button>
              <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors">
                Space Technology
              </button>
              <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors">
                Robotics
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}