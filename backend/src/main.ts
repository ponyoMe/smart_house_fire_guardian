import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder } from '@nestjs/swagger/dist/document-builder';
import { SwaggerModule } from '@nestjs/swagger/dist/swagger-module';
import { HttpExceptionFilter } from './http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors()

  app.useGlobalFilters(new HttpExceptionFilter());
  const options = new DocumentBuilder()
    .setTitle('API IOT Fire Guardian') // API title
    .setDescription('API documentation for our diploma project Fire Guardian Smart House')
    .setVersion('1.0') // API version
    .addTag('users') // optional: add a tag for grouping (e.g., "users")
    .build();

  const document = SwaggerModule.createDocument(app, options);

  // swagger UI endpoint /api-docs
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
