import { Injectable, Logger } from '@nestjs/common';
import { GameState, Player, GameAction } from './game-engine.service';

@Injectable()
export class AiOpponentService {
  private readonly logger = new Logger(AiOpponentService.name);

  async getAiAction(gameState: GameState, aiPlayerId: string): Promise<GameAction | null> {
    try {
      const aiPlayer = gameState.players.find(p => p.id === aiPlayerId);
      const opponent = gameState.players.find(p => p.id !== aiPlayerId);

      if (!aiPlayer || !opponent) {
        return null;
      }

      // Simple AI strategy
      switch (gameState.phase) {
        case 'DON_PHASE':
          return this.handleDonPhase(aiPlayer);
        case 'MAIN_PHASE':
          return this.handleMainPhase(aiPlayer, opponent);
        case 'BATTLE_PHASE':
          return this.handleBattlePhase(aiPlayer, opponent);
        case 'END_PHASE':
          return this.handleEndPhase(aiPlayer);
        default:
          return null;
      }
    } catch (error) {
      this.logger.error('AI action generation failed:', error.message);
      return null;
    }
  }

  private handleDonPhase(aiPlayer: Player): GameAction {
    // In Don phase, AI just ends the phase
    return {
      type: 'END_TURN',
      playerId: aiPlayer.id,
    };
  }

  private handleMainPhase(aiPlayer: Player, opponent: Player): GameAction | null {
    // Try to play a card if possible
    const playableCards = aiPlayer.hand.filter(card => 
      card.cost && card.cost <= aiPlayer.don
    );

    if (playableCards.length > 0) {
      // Play the cheapest card
      const cardToPlay = playableCards.reduce((cheapest, current) => 
        (current.cost || 0) < (cheapest.cost || 0) ? current : cheapest
      );

      return {
        type: 'PLAY_CARD',
        playerId: aiPlayer.id,
        cardId: cardToPlay.id,
      };
    }

    // If no cards to play, end turn
    return {
      type: 'END_TURN',
      playerId: aiPlayer.id,
    };
  }

  private handleBattlePhase(aiPlayer: Player, opponent: Player): GameAction | null {
    // Try to attack with characters
    const attackingCharacters = aiPlayer.field.filter(card => 
      card.cardType === 'Character' && !card.isResting
    );

    if (attackingCharacters.length > 0) {
      // Attack with the strongest character
      const attacker = attackingCharacters.reduce((strongest, current) => 
        (current.power || 0) > (strongest.power || 0) ? current : strongest
      );

      return {
        type: 'ATTACK',
        playerId: aiPlayer.id,
        cardId: attacker.id,
      };
    }

    // If no characters to attack with, end turn
    return {
      type: 'END_TURN',
      playerId: aiPlayer.id,
    };
  }

  private handleEndPhase(aiPlayer: Player): GameAction {
    return {
      type: 'END_TURN',
      playerId: aiPlayer.id,
    };
  }

  // AI difficulty levels
  getDifficultyLevel(): 'EASY' | 'MEDIUM' | 'HARD' {
    // For now, always return EASY
    // In the future, this could be based on player stats or preferences
    return 'EASY';
  }

  // AI decision making based on difficulty
  makeDecision(aiPlayer: Player, opponent: Player, difficulty: 'EASY' | 'MEDIUM' | 'HARD'): GameAction | null {
    switch (difficulty) {
      case 'EASY':
        return this.makeEasyDecision(aiPlayer, opponent);
      case 'MEDIUM':
        return this.makeMediumDecision(aiPlayer, opponent);
      case 'HARD':
        return this.makeHardDecision(aiPlayer, opponent);
      default:
        return this.makeEasyDecision(aiPlayer, opponent);
    }
  }

  private makeEasyDecision(aiPlayer: Player, opponent: Player): GameAction | null {
    // Simple random decisions
    const actions = ['PLAY_CARD', 'ATTACK', 'END_TURN'];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    
    return {
      type: randomAction as any,
      playerId: aiPlayer.id,
    };
  }

  private makeMediumDecision(aiPlayer: Player, opponent: Player): GameAction | null {
    // Slightly more strategic decisions
    // Prioritize playing cards over attacking
    if (aiPlayer.hand.length > 0) {
      return {
        type: 'PLAY_CARD',
        playerId: aiPlayer.id,
        cardId: aiPlayer.hand[0].id,
      };
    }
    
    return {
      type: 'END_TURN',
      playerId: aiPlayer.id,
    };
  }

  private makeHardDecision(aiPlayer: Player, opponent: Player): GameAction | null {
    // Advanced strategic decisions
    // Analyze board state, hand composition, and opponent's threats
    // This would be much more complex in a real implementation
    
    // For now, just use medium decision logic
    return this.makeMediumDecision(aiPlayer, opponent);
  }
}
