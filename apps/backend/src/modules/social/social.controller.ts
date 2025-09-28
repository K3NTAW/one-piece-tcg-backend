import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('social')
@Controller('social')
export class SocialController {
  constructor() {}
}
