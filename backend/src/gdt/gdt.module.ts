import { Module } from '@nestjs/common';
import { GdtController } from './gdt.controller';
import { GdtService } from './gdt.service';

@Module({
  controllers: [GdtController],
  providers: [GdtService],
})
export class GdtModule {}
