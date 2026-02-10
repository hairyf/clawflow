import { Module } from '@nestjs/common'
import { ScheduleModule as NestjsScheduleModule } from '@nestjs/schedule'
import { AppService } from './app.service'

@Module({
  imports: [
    NestjsScheduleModule.forRoot(),
  ],
  providers: [
    AppService,
  ],
})
export class AppModule {}
