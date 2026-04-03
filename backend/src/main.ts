import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://ketoan.tamtin.id.vn',
      'http://ketoan.tamtin.id.vn',
    ],
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`\n🚀 TamTin Backend chạy tại: http://localhost:${port}`);
  console.log(`📊 API prefix: /api\n`);
}
bootstrap();
