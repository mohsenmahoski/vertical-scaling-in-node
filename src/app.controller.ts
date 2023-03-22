import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  private fibonacci (n){
    return n < 1 ? 0 : n <= 2 ? 1 : this.fibonacci(n - 1) + this.fibonacci(n - 2);
  };

  @Get()
  getFibonacci(): string {
    const result = this.fibonacci(40);
    console.log(process.pid);
    return result;
  }
}
