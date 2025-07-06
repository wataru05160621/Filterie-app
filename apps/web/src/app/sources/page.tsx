import Link from 'next/link';
import { Card } from '@/components/Card';

interface Source {
  id: string;
  name: string;
  url: string;
  tier: number;
  description: string;
  isActive: boolean;
  lastFetchedAt?: Date;
}

// Mock data for now
const mockSources: Source[] = [
  {
    id: '1',
    name: 'Apple Newsroom',
    url: 'https://www.apple.com/newsroom/',
    tier: 1,
    description: 'Apple公式のプレスリリース・ニュースサイト',
    isActive: true,
    lastFetchedAt: new Date('2024-01-20T10:30:00'),
  },
  {
    id: '2',
    name: 'Reuters Technology',
    url: 'https://www.reuters.com/technology/',
    tier: 2,
    description: 'ロイター通信のテクノロジーニュース',
    isActive: true,
    lastFetchedAt: new Date('2024-01-20T10:25:00'),
  },
  {
    id: '3',
    name: 'TechCrunch',
    url: 'https://techcrunch.com/',
    tier: 3,
    description: 'スタートアップ・テクノロジーニュースメディア',
    isActive: true,
    lastFetchedAt: new Date('2024-01-20T10:20:00'),
  },
];

const getTierColor = (tier: number) => {
  switch (tier) {
    case 1: return 'bg-blue-100 text-blue-800 border-blue-200';
    case 2: return 'bg-green-100 text-green-800 border-green-200';
    case 3: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 4: return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getTierLabel = (tier: number) => {
  switch (tier) {
    case 1: return 'Tier 1 - 一次情報源';
    case 2: return 'Tier 2 - 信頼メディア';
    case 3: return 'Tier 3 - 一般メディア';
    case 4: return 'Tier 4 - UGC';
    default: return `Tier ${tier}`;
  }
};

export default function SourcesPage() {
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
              <Link href="/sources" className="text-blue-600">
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">情報源一覧</h1>
          <p className="mt-2 text-gray-600">
            Filterieが監視している情報源の一覧です。Tierレベルによって信頼性が分類されています。
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((tier) => (
            <Card key={tier} className="text-center">
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getTierColor(tier)}`}>
                {getTierLabel(tier)}
              </div>
              <p className="mt-2 text-2xl font-bold">
                {mockSources.filter(s => s.tier === tier).length}
              </p>
              <p className="text-gray-500">情報源</p>
            </Card>
          ))}
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    情報源
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状態
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最終取得
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockSources.map((source) => (
                  <tr key={source.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {source.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {source.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTierColor(source.tier)}`}>
                        Tier {source.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        source.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {source.isActive ? 'アクティブ' : '非アクティブ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {source.lastFetchedAt 
                        ? new Date(source.lastFetchedAt).toLocaleString('ja-JP')
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900"
                      >
                        訪問
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </>
  );
}