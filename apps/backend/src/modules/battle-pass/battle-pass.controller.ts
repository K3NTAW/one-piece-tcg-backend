import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('battle-pass')
@Controller('battle-pass')
export class BattlePassController {
  constructor() {}
}
