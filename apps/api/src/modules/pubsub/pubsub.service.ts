import { Injectable, Inject } from '@nestjs/common';
import { PUB_SUB } from './pubsub.module';

@Injectable()
export class PubSubService {
  constructor(@Inject(PUB_SUB) private pubSub: any) {}

  async publishArticleCreated(article: any): Promise<void> {
    await this.pubSub.publish('articleCreated', {
      articleCreated: article,
    });
  }

  async publishArticleUpdated(article: any): Promise<void> {
    await this.pubSub.publish('articleUpdated', {
      articleUpdated: article,
    });
  }

  async publishSourceStatusChanged(sourceUpdate: any): Promise<void> {
    await this.pubSub.publish('sourceStatusChanged', {
      sourceStatusChanged: sourceUpdate,
    });
  }

  asyncIterator<T>(triggers: string | string[]): AsyncIterator<T> {
    return this.pubSub.asyncIterator(triggers);
  }
}