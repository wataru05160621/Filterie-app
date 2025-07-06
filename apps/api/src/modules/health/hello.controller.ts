import { Controller, Get } from '@nestjs/common';

interface HelloResponse {
  message: string;
  timestamp: string;
}

@Controller('hello')
export class HelloController {
  @Get()
  getHello(): HelloResponse {
    return {
      message: 'Hello from Filterie!',
      timestamp: new Date().toISOString(),
    };
  }
}