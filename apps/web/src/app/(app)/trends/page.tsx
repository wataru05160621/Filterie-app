export default function TrendsPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Trends</h1>
          <p className="text-gray-400">Discover trending topics and emerging stories</p>
        </div>
        
        {/* Placeholder content */}
        <div className="grid gap-6">
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Trending Topics</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <h3 className="font-medium text-white">#AI Development</h3>
                  <p className="text-sm text-gray-400">2,341 articles · 15% increase</p>
                </div>
                <span className="text-green-500 text-sm font-medium">↑ 15%</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <h3 className="font-medium text-white">#Climate Tech</h3>
                  <p className="text-sm text-gray-400">1,892 articles · 8% increase</p>
                </div>
                <span className="text-green-500 text-sm font-medium">↑ 8%</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <h3 className="font-medium text-white">#Quantum Computing</h3>
                  <p className="text-sm text-gray-400">987 articles · 23% increase</p>
                </div>
                <span className="text-green-500 text-sm font-medium">↑ 23%</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Emerging Stories</h2>
            <p className="text-gray-400">Real-time trend analysis coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}