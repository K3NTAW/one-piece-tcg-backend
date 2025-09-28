import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GamesService } from './games.service';
import { GameEngineService, GameAction } from './game-engine.service';

@ApiTags('games')
@Controller('games')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GamesController {
  constructor(
    private readonly gamesService: GamesService,
    private readonly gameEngineService: GameEngineService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user games' })
  @ApiResponse({ status: 200, description: 'Games retrieved successfully' })
  async findAll(@Request() req) {
    return this.gamesService.findUserGames(req.user.id);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create new game' })
  @ApiResponse({ status: 201, description: 'Game created successfully' })
  async createGame(
    @Request() req,
    @Body() body: { opponentId: string; deckId: string; opponentDeckId: string },
  ) {
    return this.gameEngineService.createGame(
      req.user.id,
      body.opponentId,
      body.deckId,
      body.opponentDeckId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get game by ID' })
  @ApiResponse({ status: 200, description: 'Game retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Game not found' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.gamesService.findOne(id, req.user.id);
  }

  @Post(':id/action')
  @ApiOperation({ summary: 'Process game action' })
  @ApiResponse({ status: 200, description: 'Action processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid action' })
  async processAction(
    @Request() req,
    @Param('id') id: string,
    @Body() action: GameAction,
  ) {
    return this.gameEngineService.processAction(id, action);
  }

  @Post(':id/concede')
  @ApiOperation({ summary: 'Concede game' })
  @ApiResponse({ status: 200, description: 'Game conceded successfully' })
  async concedeGame(@Request() req, @Param('id') id: string) {
    const action: GameAction = {
      type: 'CONCEDE',
      playerId: req.user.id,
    };
    return this.gameEngineService.processAction(id, action);
  }
}
