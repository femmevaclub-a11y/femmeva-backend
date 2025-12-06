import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log(
    '🔥 FEMMEVA API — Versión de despliegue:',
    new Date().toISOString(),
  );

  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 FEMMEVA API escuchando en el puerto ${port}`);
}
bootstrap();
