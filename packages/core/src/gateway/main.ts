import { NestFactory } from '@nestjs/core'
import consola from 'consola'
import { AppModule } from './app.module'

export async function start() {
  const app = await NestFactory.create(AppModule, { logger: false })
  await app.listen(18790)
  consola.info('Gateway started on port 18790')
}
