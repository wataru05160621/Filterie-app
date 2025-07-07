import Link from 'next/link';

export default function Home() {
  return (
    <>
      <nav className="bg-white shadow" role="navigation">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="font-bold text-xl">
                Filterie
              </Link>
            </div>
            <div className="flex space-x-4">
              <Link href="/" className="hover:text-blue-600">
                ホーム
              </Link>
              <Link href="/sources" className="hover:text-blue-600">
                情報源
              </Link>
              <Link href="/articles" className="hover:text-blue-600">
                記事
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <section className="text-center py-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Filterie - 情報濾過ハブ
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            一次情報に素早くアクセスし、AIフィルタリングで価値ある情報のみを抽出
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
            >
              今すぐ始める
            </Link>
            <Link
              href="/about"
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-300"
            >
              詳しく見る
            </Link>
          </div>
        </section>

        <section className="py-16">
          <h2 className="text-3xl font-bold text-center mb-12">主な機能</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">信頼できる情報源</h3>
              <p className="text-gray-600">
                企業公式サイトや要人の認証済みアカウントなど、信頼性の高い一次情報源から情報を収集
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">AI要約</h3>
              <p className="text-gray-600">
                最新のAI技術により、大量の情報を瞬時に要約し、重要なポイントのみを抽出
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2">パーソナライズ</h3>
              <p className="text-gray-600">
                あなたの興味や関心に基づいて、最も関連性の高い情報を優先的に表示
              </p>
            </div>
          </div>
        </section>

        <section className="py-16">
          <h2 className="text-3xl font-bold text-center mb-12">情報源のTier分類</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Tier 1</h3>
              <p className="text-sm text-blue-700">一次情報源</p>
              <p className="text-gray-600 mt-2">企業公式サイト、要人認証アカウント</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Tier 2</h3>
              <p className="text-sm text-green-700">信頼メディア</p>
              <p className="text-gray-600 mt-2">大手報道機関、専門アナリスト</p>
            </div>
            <div className="bg-yellow-50 p-6 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">Tier 3</h3>
              <p className="text-sm text-yellow-700">一般メディア</p>
              <p className="text-gray-600 mt-2">オンラインメディア、ブログ</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Tier 4</h3>
              <p className="text-sm text-gray-700">UGC</p>
              <p className="text-gray-600 mt-2">ユーザー生成コンテンツ</p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}