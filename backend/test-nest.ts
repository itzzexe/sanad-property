import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';

@Module({})
class EmptyModule {}

async function bootstrap() {
  console.log('--- Starting Empty App ---');
  const app = await NestFactory.create(EmptyModule);
  console.log('--- Empty App Created ---');
  await app.listen(4000);
  console.log('🚀 Empty API running on http://localhost:4000');
}
bootstrap();
