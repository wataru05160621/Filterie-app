"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  UserIcon, 
  BellIcon, 
  SparklesIcon, 
  ServerIcon, 
  ShieldCheckIcon,
  CreditCardIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";

const settingsNavigation = [
  {
    name: "Profile",
    href: "/settings/profile",
    icon: UserIcon,
    description: "Manage your personal information"
  },
  {
    name: "Notifications",
    href: "/settings/notifications",
    icon: BellIcon,
    description: "Configure notification preferences"
  },
  {
    name: "AI Preferences",
    href: "/settings/ai",
    icon: SparklesIcon,
    description: "Customize AI filtering and recommendations"
  },
  {
    name: "Source Management",
    href: "/settings/sources",
    icon: ServerIcon,
    description: "Manage your information sources"
  },
  {
    name: "Security",
    href: "/settings/security",
    icon: ShieldCheckIcon,
    description: "Account security and privacy settings"
  },
  {
    name: "Billing",
    href: "/settings/billing",
    icon: CreditCardIcon,
    description: "Manage subscription and payment methods"
  }
];

export default function SettingsPage() {
  const pathname = usePathname();

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account and preferences</p>
        </div>

        <div className="space-y-2">
          {settingsNavigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  block rounded-lg border transition-all
                  ${isActive 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-gray-900 border-gray-800 hover:bg-gray-800 hover:border-gray-700'
                  }
                `}
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className={`
                      rounded-lg p-2
                      ${isActive ? 'bg-gray-700' : 'bg-gray-800'}
                    `}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{item.name}</h3>
                      <p className="text-sm text-gray-400 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 p-4 bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-lg border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">Pro Plan</h3>
              <p className="text-sm text-gray-400 mt-0.5">You have access to all premium features</p>
            </div>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-full">
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}