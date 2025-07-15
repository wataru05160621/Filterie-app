"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  HomeIcon, 
  NewspaperIcon, 
  ArrowTrendingUpIcon, 
  SparklesIcon, 
  ServerIcon, 
  BookmarkIcon, 
  CogIcon,
  FunnelIcon
} from "@heroicons/react/24/outline";
import { 
  HomeIcon as HomeIconSolid,
  NewspaperIcon as NewspaperIconSolid,
  ArrowTrendingUpIcon as ArrowTrendingUpIconSolid,
  SparklesIcon as SparklesIconSolid,
  ServerIcon as ServerIconSolid,
  BookmarkIcon as BookmarkIconSolid,
  CogIcon as CogIconSolid,
} from "@heroicons/react/24/solid";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const navigation = [
  { 
    name: "Dashboard", 
    href: "/dashboard", 
    icon: HomeIcon, 
    activeIcon: HomeIconSolid 
  },
  { 
    name: "Latest Articles", 
    href: "/articles", 
    icon: NewspaperIcon, 
    activeIcon: NewspaperIconSolid 
  },
  { 
    name: "Trends", 
    href: "/trends", 
    icon: ArrowTrendingUpIcon, 
    activeIcon: ArrowTrendingUpIconSolid 
  },
  { 
    name: "AI Recommendations", 
    href: "/recommendations", 
    icon: SparklesIcon, 
    activeIcon: SparklesIconSolid 
  },
  { 
    name: "Source Management", 
    href: "/sources", 
    icon: ServerIcon, 
    activeIcon: ServerIconSolid 
  },
  { 
    name: "Saved", 
    href: "/saved", 
    icon: BookmarkIcon, 
    activeIcon: BookmarkIconSolid 
  },
  { 
    name: "Settings", 
    href: "/settings", 
    icon: CogIcon, 
    activeIcon: CogIconSolid 
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 border-r border-gray-800">
      {/* Logo Section */}
      <div className="flex h-16 items-center justify-start px-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          {/* Gradient Icon */}
          <div className="relative h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-0.5">
            <div className="flex h-full w-full items-center justify-center rounded-lg bg-gray-900">
              <FunnelIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <span className="text-xl font-bold text-white">Filterie</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
                          (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = isActive ? item.activeIcon : item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all
                ${isActive 
                  ? 'bg-gray-800 text-white' 
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }
              `}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* AI Filtering Status */}
      <div className="border-t border-gray-800 p-4">
        <div className="rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-600/10 p-3 border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-gray-300">AI Filtering</span>
            </div>
            <span className="text-xs text-gray-500">Active</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Analyzing 1,247 sources
          </p>
        </div>
        
        {/* Theme Toggle */}
        <div className="mt-4 flex items-center justify-center">
          <ThemeToggle className="w-full justify-center" />
        </div>
      </div>
    </div>
  );
}