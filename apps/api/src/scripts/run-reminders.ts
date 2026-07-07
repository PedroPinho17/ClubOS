import '../env';
import { prisma } from '@clubos/database';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { RemindersService } from '../modules/reminders/reminders.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  const reminders = app.get(RemindersService);
  const results = await reminders.runForAllOrganizations();
  for (const r of results) {
    console.log(`${r.organizationName}: enviados=${r.sent}, ignorados=${r.skipped}`);
    for (const err of r.errors) console.log(`  erro: ${err}`);
  }
  await app.close();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
