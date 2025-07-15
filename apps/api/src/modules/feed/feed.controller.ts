import { Controller, Post, Get, Query, Body, Param, Headers, HttpCode, Logger } from '@nestjs/common';
import { FeedService } from './feed.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('feed')
export class FeedController {
  private readonly logger = new Logger(FeedController.name);

  constructor(private readonly feedService: FeedService) {}

  // WebSub verification endpoint
  @Public()
  @Get('websub/:sourceId')
  async verifyWebSub(
    @Param('sourceId') _sourceId: string,
    @Query('hub.mode') mode: string,
    @Query('hub.topic') topic: string,
    @Query('hub.challenge') challenge: string,
    @Query('hub.lease_seconds') _leaseSeconds?: string,
  ) {
    this.logger.log(`WebSub verification request: mode=${mode}, topic=${topic}`);

    if (mode === 'subscribe' || mode === 'unsubscribe') {
      // In production, you should verify that the topic matches your expectations
      // and that this is a legitimate subscription request
      return challenge;
    }

    throw new Error('Invalid hub.mode');
  }

  // WebSub notification endpoint
  @Public()
  @Post('websub/:sourceId')
  @HttpCode(200)
  async handleWebSubNotification(
    @Param('sourceId') sourceId: string,
    @Body() body: string,
    @Headers('x-hub-signature') signature?: string,
  ) {
    this.logger.log(`Received WebSub notification for source ${sourceId}`);

    // In production, verify the signature using your hub secret
    if (signature) {
      // TODO: Implement signature verification
      this.logger.debug(`Signature: ${signature}`);
    }

    await this.feedService.handleWebSubNotification(sourceId, body);

    return { status: 'ok' };
  }

  // Manual feed fetch endpoint (for testing/admin)
  @Post('fetch/:sourceId')
  async fetchFeed(@Param('sourceId') sourceId: string) {
    return this.feedService.fetchSingleFeed(sourceId);
  }

  // Fetch all feeds manually
  @Post('fetch-all')
  async fetchAllFeeds() {
    return this.feedService.fetchAllFeeds();
  }
}