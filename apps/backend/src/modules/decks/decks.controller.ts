import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DecksService } from './decks.service';

@ApiTags('decks')
@Controller('decks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DecksController {
  constructor(private readonly decksService: DecksService) {}

  @Get()
  @ApiOperation({ summary: 'Get user decks' })
  @ApiResponse({ status: 200, description: 'Decks retrieved successfully' })
  async findAll(@Request() req) {
    return this.decksService.findAll(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new deck' })
  @ApiResponse({ status: 201, description: 'Deck created successfully' })
  async create(@Request() req, @Body() data: any) {
    return this.decksService.create(req.user.id, data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deck by ID' })
  @ApiResponse({ status: 200, description: 'Deck retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Deck not found' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.decksService.findOne(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update deck' })
  @ApiResponse({ status: 200, description: 'Deck updated successfully' })
  @ApiResponse({ status: 404, description: 'Deck not found' })
  async update(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.decksService.update(id, req.user.id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete deck' })
  @ApiResponse({ status: 200, description: 'Deck deleted successfully' })
  @ApiResponse({ status: 404, description: 'Deck not found' })
  async delete(@Request() req, @Param('id') id: string) {
    return this.decksService.delete(id, req.user.id);
  }
}
