import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TierSeedService {
  private readonly logger = new Logger(TierSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async seed() {
    this.logger.log('Seeding Tier data...');

    await this.seedTrustedDomains();
    await this.seedVerifiedAccounts();
    
    this.logger.log('Tier data seeding completed!');
  }

  private async seedTrustedDomains() {
    const trustedDomains = [
      // Tier 1 - 企業公式
      { domain: 'apple.com', organization: 'Apple Inc.', tier: 1, category: 'corporate', verified: true },
      { domain: 'www.apple.com', organization: 'Apple Inc.', tier: 1, category: 'corporate', verified: true },
      { domain: 'google.com', organization: 'Google LLC', tier: 1, category: 'corporate', verified: true },
      { domain: 'www.google.com', organization: 'Google LLC', tier: 1, category: 'corporate', verified: true },
      { domain: 'microsoft.com', organization: 'Microsoft Corporation', tier: 1, category: 'corporate', verified: true },
      { domain: 'www.microsoft.com', organization: 'Microsoft Corporation', tier: 1, category: 'corporate', verified: true },
      { domain: 'amazon.com', organization: 'Amazon.com, Inc.', tier: 1, category: 'corporate', verified: true },
      { domain: 'www.amazon.com', organization: 'Amazon.com, Inc.', tier: 1, category: 'corporate', verified: true },
      { domain: 'meta.com', organization: 'Meta Platforms, Inc.', tier: 1, category: 'corporate', verified: true },
      { domain: 'www.meta.com', organization: 'Meta Platforms, Inc.', tier: 1, category: 'corporate', verified: true },
      
      // Tier 1 - 日本企業
      { domain: 'toyota.jp', organization: 'トヨタ自動車株式会社', tier: 1, category: 'corporate', verified: true },
      { domain: 'www.toyota.jp', organization: 'トヨタ自動車株式会社', tier: 1, category: 'corporate', verified: true },
      { domain: 'sony.jp', organization: 'ソニーグループ株式会社', tier: 1, category: 'corporate', verified: true },
      { domain: 'www.sony.jp', organization: 'ソニーグループ株式会社', tier: 1, category: 'corporate', verified: true },
      { domain: 'nintendo.co.jp', organization: '任天堂株式会社', tier: 1, category: 'corporate', verified: true },
      { domain: 'www.nintendo.co.jp', organization: '任天堂株式会社', tier: 1, category: 'corporate', verified: true },
      
      // Tier 1 - 政府機関
      { domain: 'meti.go.jp', organization: '経済産業省', tier: 1, category: 'government', verified: true },
      { domain: 'www.meti.go.jp', organization: '経済産業省', tier: 1, category: 'government', verified: true },
      { domain: 'mhlw.go.jp', organization: '厚生労働省', tier: 1, category: 'government', verified: true },
      { domain: 'www.mhlw.go.jp', organization: '厚生労働省', tier: 1, category: 'government', verified: true },
      { domain: 'mofa.go.jp', organization: '外務省', tier: 1, category: 'government', verified: true },
      { domain: 'www.mofa.go.jp', organization: '外務省', tier: 1, category: 'government', verified: true },
      { domain: 'cas.go.jp', organization: '内閣官房', tier: 1, category: 'government', verified: true },
      { domain: 'www.cas.go.jp', organization: '内閣官房', tier: 1, category: 'government', verified: true },
      
      // Tier 2 - 大手報道機関
      { domain: 'nikkei.com', organization: '日本経済新聞社', tier: 2, category: 'media', verified: true },
      { domain: 'www.nikkei.com', organization: '日本経済新聞社', tier: 2, category: 'media', verified: true },
      { domain: 'asahi.com', organization: '朝日新聞社', tier: 2, category: 'media', verified: true },
      { domain: 'www.asahi.com', organization: '朝日新聞社', tier: 2, category: 'media', verified: true },
      { domain: 'yomiuri.co.jp', organization: '読売新聞社', tier: 2, category: 'media', verified: true },
      { domain: 'www.yomiuri.co.jp', organization: '読売新聞社', tier: 2, category: 'media', verified: true },
      { domain: 'reuters.com', organization: 'Reuters', tier: 2, category: 'media', verified: true },
      { domain: 'www.reuters.com', organization: 'Reuters', tier: 2, category: 'media', verified: true },
      { domain: 'bloomberg.com', organization: 'Bloomberg L.P.', tier: 2, category: 'media', verified: true },
      { domain: 'www.bloomberg.com', organization: 'Bloomberg L.P.', tier: 2, category: 'media', verified: true },
      { domain: 'wsj.com', organization: 'The Wall Street Journal', tier: 2, category: 'media', verified: true },
      { domain: 'www.wsj.com', organization: 'The Wall Street Journal', tier: 2, category: 'media', verified: true },
      
      // Tier 3 - オンラインメディア
      { domain: 'techcrunch.com', organization: 'TechCrunch', tier: 3, category: 'online_media', verified: false },
      { domain: 'www.techcrunch.com', organization: 'TechCrunch', tier: 3, category: 'online_media', verified: false },
      { domain: 'theverge.com', organization: 'The Verge', tier: 3, category: 'online_media', verified: false },
      { domain: 'www.theverge.com', organization: 'The Verge', tier: 3, category: 'online_media', verified: false },
      { domain: 'itmedia.co.jp', organization: 'ITmedia', tier: 3, category: 'online_media', verified: false },
      { domain: 'www.itmedia.co.jp', organization: 'ITmedia', tier: 3, category: 'online_media', verified: false },
      { domain: 'gigazine.net', organization: 'GIGAZINE', tier: 3, category: 'online_media', verified: false },
      { domain: 'www.gigazine.net', organization: 'GIGAZINE', tier: 3, category: 'online_media', verified: false },
    ];

    for (const domain of trustedDomains) {
      try {
        await (this.prisma as any).trustedDomain.upsert({
          where: { domain: domain.domain },
          update: {
            organization: domain.organization,
            tier: domain.tier,
            category: domain.category,
            verified: domain.verified,
          },
          create: domain,
        });
        this.logger.log(`Seeded trusted domain: ${domain.domain}`);
      } catch (error) {
        this.logger.error(`Failed to seed domain ${domain.domain}:`, error);
      }
    }
  }

  private async seedVerifiedAccounts() {
    const verifiedAccounts = [
      // Tech CEOs
      {
        platform: 'twitter',
        accountId: 'elonmusk',
        accountName: 'Elon Musk',
        personName: 'Elon Musk',
        title: 'CEO',
        organization: 'Tesla, SpaceX, X',
        tier: 1,
        verifiedAt: new Date(),
      },
      {
        platform: 'twitter',
        accountId: 'tim_cook',
        accountName: 'Tim Cook',
        personName: 'Tim Cook',
        title: 'CEO',
        organization: 'Apple Inc.',
        tier: 1,
        verifiedAt: new Date(),
      },
      {
        platform: 'twitter',
        accountId: 'sundarpichai',
        accountName: 'Sundar Pichai',
        personName: 'Sundar Pichai',
        title: 'CEO',
        organization: 'Google, Alphabet Inc.',
        tier: 1,
        verifiedAt: new Date(),
      },
      {
        platform: 'twitter',
        accountId: 'satyanadella',
        accountName: 'Satya Nadella',
        personName: 'Satya Nadella',
        title: 'CEO',
        organization: 'Microsoft Corporation',
        tier: 1,
        verifiedAt: new Date(),
      },
      {
        platform: 'twitter',
        accountId: 'jeffbezos',
        accountName: 'Jeff Bezos',
        personName: 'Jeff Bezos',
        title: 'Executive Chairman',
        organization: 'Amazon.com, Inc.',
        tier: 1,
        verifiedAt: new Date(),
      },
      
      // Japanese Business Leaders
      {
        platform: 'twitter',
        accountId: 'masason',
        accountName: '孫正義',
        personName: '孫正義',
        title: '代表取締役会長兼社長',
        organization: 'ソフトバンクグループ株式会社',
        tier: 1,
        verifiedAt: new Date(),
      },
      {
        platform: 'twitter',
        accountId: 'mikitani_e',
        accountName: '三木谷浩史',
        personName: '三木谷浩史',
        title: '代表取締役会長兼社長',
        organization: '楽天グループ株式会社',
        tier: 1,
        verifiedAt: new Date(),
      },
    ];

    for (const account of verifiedAccounts) {
      try {
        await (this.prisma as any).verifiedAccount.upsert({
          where: {
            platform_accountId: {
              platform: account.platform,
              accountId: account.accountId,
            },
          },
          update: {
            accountName: account.accountName,
            personName: account.personName,
            title: account.title,
            organization: account.organization,
            tier: account.tier,
            verifiedAt: account.verifiedAt,
          },
          create: account,
        });
        this.logger.log(`Seeded verified account: ${account.accountName} (@${account.accountId})`);
      } catch (error) {
        this.logger.error(`Failed to seed account ${account.accountId}:`, error);
      }
    }
  }
}