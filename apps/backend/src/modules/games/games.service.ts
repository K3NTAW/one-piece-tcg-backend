import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.game.findMany({
      include: {
        players: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findUserGames(userId: string) {
    return this.prisma.game.findMany({
      where: {
        OR: [
          { player1Id: userId },
          { player2Id: userId },
        ],
      },
      include: {
        players: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.game.findFirst({
      where: {
        id,
        OR: [
          { player1Id: userId },
          { player2Id: userId },
        ],
      },
      include: {
        players: {
          include: {
            user: true,
          },
        },
        actions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async createGame(player1Id: string, player2Id: string, deck1Id: string, deck2Id: string) {
    return this.prisma.game.create({
      data: {
        player1Id,
        player2Id,
        deck1Id,
        deck2Id,
        status: 'ACTIVE',
        currentPlayerId: player1Id,
        turn: 1,
        phase: 'DON_PHASE',
      },
    });
  }

  async updateGame(id: string, data: any) {
    return this.prisma.game.update({
      where: { id },
      data,
    });
  }

  async addGameAction(gameId: string, action: any) {
    return this.prisma.gameAction.create({
      data: {
        gameId,
        ...action,
      },
    });
  }

  // Multiplayer methods
  async create(data: any) {
    const gameData: any = {
      ...data,
      gameState: {
        phase: 'setup',
        turn: 1,
        currentPlayer: data.player1Id,
        players: {
          [data.player1Id]: {
            life: 4,
            hand: [],
            deck: [],
            field: [],
            trash: [],
          },
        },
      },
    };

    // Only add player2 if it exists
    if (data.player2Id) {
      gameData.gameState.players[data.player2Id] = {
        life: 4,
        hand: [],
        deck: [],
        field: [],
        trash: [],
      };
    }

    return this.prisma.game.create({
      data: {
        player1Id: gameData.player1Id,
        player2Id: gameData.player2Id,
        deck1Id: gameData.deck1Id,
        deck2Id: gameData.deck2Id,
        gameState: gameData.gameState,
        status: 'waiting', // Add required status field
        currentPlayerId: gameData.gameState.currentPlayer, // Add required currentPlayerId field
        turn: 1, // Add required turn field
        phase: 'setup', // Add required phase field
      },
      include: {
        deck1: true,
        deck2: true,
        player1: true,
        player2: true,
      },
    });
  }

  async update(gameId: string, data: any) {
    return this.prisma.game.update({
      where: { id: gameId },
      data,
      include: {
        deck1: true,
        deck2: true,
        player1: true,
        player2: true,
      },
    });
  }

  async initializeGame(gameId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: {
        deck1: {
          include: {
            cards: {
              include: {
                card: true,
              },
            },
            leader: true,
          },
        },
        deck2: {
          include: {
            cards: {
              include: {
                card: true,
              },
            },
            leader: true,
          },
        },
      },
    });

    if (!game) {
      throw new Error('Game not found');
    }

    // Initialize game state with shuffled decks
    const deck1Cards = this.shuffleDeck(game.deck1.cards.map(dc => dc.card));
    const deck2Cards = game.deck2 ? this.shuffleDeck(game.deck2.cards.map(dc => dc.card)) : [];

    const gameState: any = {
      phase: 'main',
      turn: 1,
      currentPlayer: game.player1Id,
      players: {
        [game.player1Id]: {
          life: 4,
          lifeCards: deck1Cards.slice(0, 4), // First 4 cards are life cards
          hand: deck1Cards.slice(4, 9), // Draw 5 cards (after life cards)
          deck: deck1Cards.slice(9),
          characters: [], // Character area
          stages: [], // Stage area
          donDeck: Array(10).fill({ type: 'DON!!', id: 'don-1', tapped: false }), // 10 DON!! cards
          donArea: [{ type: 'DON!!', id: 'don-1', tapped: false }], // First player starts with 1 DON!!
          trash: [],
          leader: game.deck1.leader,
          canAttack: false, // First player can't attack on first turn
          isFirstTurn: true, // Track if this is the first turn
        },
      },
    };

    // Add player2 if they exist
    if (game.player2Id && game.deck2) {
      gameState.players[game.player2Id] = {
        life: 4,
        lifeCards: deck2Cards.slice(0, 4), // First 4 cards are life cards
        hand: deck2Cards.slice(4, 9), // Draw 5 cards (after life cards)
        deck: deck2Cards.slice(9),
        characters: [], // Character area
        stages: [], // Stage area
        donDeck: Array(10).fill({ type: 'DON!!', id: 'don-1', tapped: false }), // 10 DON!! cards
        donArea: [], // Available DON!! resources
        trash: [],
        leader: game.deck2.leader,
        canAttack: true, // Second player can attack on their first turn
        isFirstTurn: true, // Track if this is the first turn
      };
    }

    // Update game with initial state
    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        gameState,
        phase: 'refresh',
        turn: 1,
        currentPlayerId: game.player1Id,
      },
    });

    return gameState;
  }

  async processAction(gameId: string, actionData: any) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new Error('Game not found');
    }

    // Process the action based on type
    let newGameState = game.gameState ? { ...(game.gameState as any) } : {};
    
    switch (actionData.action.type) {
      case 'playCard':
        newGameState = this.processPlayCard(newGameState, actionData);
        break;
      case 'attack':
        newGameState = this.processAttack(newGameState, actionData);
        break;
      case 'endTurn':
        newGameState = this.processEndTurn(newGameState, actionData);
        break;
      case 'nextPhase':
        newGameState = this.processNextPhase(newGameState, actionData);
        break;
      case 'mulligan':
        newGameState = this.processMulligan(newGameState, actionData);
        break;
      case 'defend':
        newGameState = this.processDefense(newGameState, actionData);
        break;
      case 'resolveAttack':
        newGameState = this.resolveAttack(newGameState);
        break;
      case 'attachDon':
        newGameState = this.processAttachDon(newGameState, actionData);
        break;
      case 'playCard':
        newGameState = this.processPlayCard(newGameState, actionData);
        break;
      default:
        throw new Error('Unknown action type');
    }

    // Update game state
    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        gameState: newGameState,
        currentPlayerId: newGameState.currentPlayer,
        turn: newGameState.turn,
        phase: newGameState.phase,
      },
    });

    return {
      success: true,
      gameState: newGameState,
    };
  }

  private shuffleDeck(deckCards: any[]) {
    const shuffled = [...deckCards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }


  private processAttack(gameState: any, actionData: any) {
    const { attackerId, targetId, attackerCardId } = actionData.action;
    const attacker = gameState.players[attackerId];
    
    if (!attacker || !attacker.canAttack) {
      throw new Error('Cannot attack - not your turn or attack not allowed');
    }
    
    // Find the attacking card
    const attackingCard = this.findCardInPlay(attacker, attackerCardId);
    if (!attackingCard) {
      throw new Error('Attacking card not found');
    }
    
    // Check summoning sickness (can't attack if just played this turn unless Rush)
    if (attackingCard.summoningSickness) {
      throw new Error('This character has summoning sickness and cannot attack this turn');
    }
    
    // Check if card is already tapped
    if (attackingCard.tapped) {
      throw new Error('This character has already been used this turn');
    }
    
    // Mark card as tapped (used for attack)
    attackingCard.tapped = true;
    
    // Calculate attack power (base power + attached DON!!)
    const basePower = attackingCard.power || 0;
    const attachedDon = attackingCard.attachedDon || 0;
    const totalPower = basePower + (attachedDon * 1000);
    
    // Create attack state for response phase
    gameState.attackState = {
      attackerId,
      targetId,
      attackerCardId,
      attackerPower: totalPower,
      phase: 'defense', // Waiting for defense response
      responses: []
    };
    
    return gameState;
  }

  private processDefense(gameState: any, actionData: any) {
    const { defenderId, defenseType, cardId, donUsed } = actionData.action;
    const defender = gameState.players[defenderId];
    
    if (!gameState.attackState || gameState.attackState.phase !== 'defense') {
      throw new Error('No active attack to defend against');
    }
    
    if (!defender) {
      throw new Error('Defender not found');
    }
    
    // Add defense response
    const response = {
      type: defenseType,
      cardId,
      donUsed: donUsed || 0,
      timestamp: Date.now()
    };
    
    gameState.attackState.responses.push(response);
    
    // Process different defense types
    switch (defenseType) {
      case 'counter':
        this.processCounterDefense(gameState, response, defender);
        break;
      case 'blocker':
        this.processBlockerDefense(gameState, response, defender);
        break;
      case 'effect':
        this.processEffectDefense(gameState, response, defender);
        break;
      case 'character_effect':
        this.processCharacterEffectDefense(gameState, response, defender);
        break;
    }
    
    return gameState;
  }

  private processCounterDefense(gameState: any, response: any, defender: any) {
    const donUsed = response.donUsed;
    const availableDon = defender.donArea.filter((don: any) => !don.tapped).length;
    
    if (donUsed > availableDon) {
      throw new Error('Not enough DON!! available for counter');
    }
    
    // Tap DON!! cards for counter
    let donToTap = donUsed;
    defender.donArea.forEach((don: any) => {
      if (donToTap > 0 && !don.tapped) {
        don.tapped = true;
        donToTap--;
      }
    });
    
    // Increase defender's power
    gameState.attackState.defenderPower = (gameState.attackState.defenderPower || 0) + donUsed * 1000;
  }

  private processBlockerDefense(gameState: any, response: any, defender: any) {
    const blockerCard = this.findCardInPlay(defender, response.cardId);
    if (!blockerCard) {
      throw new Error('Blocker card not found');
    }
    
    if (blockerCard.tapped) {
      throw new Error('Blocker card is already tapped');
    }
    
    // Redirect attack to blocker
    gameState.attackState.targetId = response.cardId;
    gameState.attackState.defenderPower = blockerCard.power || 0;
    blockerCard.tapped = true;
  }

  private processEffectDefense(gameState: any, response: any, defender: any) {
    const effectCard = this.findCardInHand(defender, response.cardId);
    if (!effectCard) {
      throw new Error('Effect card not found in hand');
    }
    
    // Check if player has enough DON!! for effect cost
    const effectCost = effectCard.cost || 0;
    const availableDon = defender.donArea.filter((don: any) => !don.tapped).length;
    
    if (effectCost > availableDon) {
      throw new Error('Not enough DON!! for effect card');
    }
    
    // Pay DON!! cost
    let donToTap = effectCost;
    defender.donArea.forEach((don: any) => {
      if (donToTap > 0 && !don.tapped) {
        don.tapped = true;
        donToTap--;
      }
    });
    
    // Move effect card to trash
    const cardIndex = defender.hand.findIndex((card: any) => card.id === response.cardId);
    if (cardIndex !== -1) {
      const usedCard = defender.hand.splice(cardIndex, 1)[0];
      defender.trash.push(usedCard);
    }
    
    // Apply effect (this would be card-specific logic)
    this.applyEffectCard(gameState, effectCard, defender);
  }

  private processCharacterEffectDefense(gameState: any, response: any, defender: any) {
    const characterCard = this.findCardInPlay(defender, response.cardId);
    if (!characterCard) {
      throw new Error('Character card not found');
    }
    
    if (characterCard.tapped) {
      throw new Error('Character card is already tapped');
    }
    
    // Check if character has usable effect
    if (!characterCard.effectText || characterCard.effectUsed) {
      throw new Error('Character effect not available');
    }
    
    // Mark effect as used
    characterCard.effectUsed = true;
    characterCard.tapped = true;
    
    // Apply character effect (this would be card-specific logic)
    this.applyCharacterEffect(gameState, characterCard, defender);
  }

  private resolveAttack(gameState: any) {
    const attack = gameState.attackState;
    if (!attack) return gameState;
    
    const attacker = gameState.players[attack.attackerId];
    const defender = gameState.players[attack.targetId];
    
    const attackerPower = attack.attackerPower;
    const defenderPower = attack.defenderPower || 0;
    
    if (attackerPower > defenderPower) {
      // Attack successful - deal damage
      if (defender.life > 0) {
        defender.life--;
        // Move a life card to hand
        if (defender.lifeCards.length > 0) {
          const lifeCard = defender.lifeCards.pop();
          defender.hand.push(lifeCard);
        }
      }
    }
    
    // Clear attack state
    delete gameState.attackState;
    
    return gameState;
  }

  private findCardInPlay(player: any, cardId: string) {
    return [...(player.characters || []), ...(player.stages || [])]
      .find((card: any) => card.id === cardId);
  }

  private findCardInHand(player: any, cardId: string) {
    return player.hand.find((card: any) => card.id === cardId);
  }

  private applyEffectCard(gameState: any, effectCard: any, player: any) {
    // This would contain card-specific effect logic
    // For now, just a placeholder
    console.log(`Applied effect: ${effectCard.name}`);
  }

  private applyCharacterEffect(gameState: any, characterCard: any, player: any) {
    // This would contain character-specific effect logic
    // For now, just a placeholder
    console.log(`Applied character effect: ${characterCard.name}`);
  }

  private processAttachDon(gameState: any, actionData: any) {
    const { playerId, targetCardId, donCount } = actionData.action;
    const player = gameState.players[playerId];
    
    if (!player) {
      throw new Error('Player not found');
    }

    // Check if player has enough untapped DON!! cards
    const availableDon = player.donArea.filter((don: any) => !don.tapped).length;
    if (donCount > availableDon) {
      throw new Error('Not enough DON!! cards available');
    }

    // Find target card (character or leader)
    let targetCard = null;
    if (targetCardId === 'leader') {
      targetCard = player.leader;
    } else {
      targetCard = this.findCardInPlay(player, targetCardId);
    }

    if (!targetCard) {
      throw new Error('Target card not found');
    }

    // Attach DON!! cards to target
    let donToAttach = donCount;
    player.donArea.forEach((don: any) => {
      if (donToAttach > 0 && !don.tapped) {
        don.tapped = true;
        don.attachedTo = targetCardId;
        donToAttach--;
      }
    });

    // Boost target's power (each DON!! adds 1000 power)
    targetCard.attachedDon = (targetCard.attachedDon || 0) + donCount;
    targetCard.currentPower = (targetCard.power || 0) + (targetCard.attachedDon * 1000);

    return gameState;
  }

  private processPlayCard(gameState: any, actionData: any) {
    const { playerId, cardId, target } = actionData.action;
    const player = gameState.players[playerId];
    
    if (!player) {
      throw new Error('Player not found');
    }

    // Find card in hand
    const cardIndex = player.hand.findIndex((card: any) => card.id === cardId);
    if (cardIndex === -1) {
      throw new Error('Card not found in hand');
    }

    const card = player.hand[cardIndex];
    const cardCost = card.cost || 0;

    // Check if player has enough DON!! to pay cost
    const availableDon = player.donArea.filter((don: any) => !don.tapped).length;
    if (cardCost > availableDon) {
      throw new Error('Not enough DON!! to play this card');
    }

    // Pay DON!! cost
    let donToTap = cardCost;
    player.donArea.forEach((don: any) => {
      if (donToTap > 0 && !don.tapped) {
        don.tapped = true;
        donToTap--;
      }
    });

    // Remove card from hand
    const playedCard = player.hand.splice(cardIndex, 1)[0];
    
    // Add summoning sickness (can't attack this turn unless Rush)
    playedCard.summoningSickness = !playedCard.effectText?.includes('[Rush]');
    playedCard.tapped = false;

    // Place card in appropriate area
    if (playedCard.cardType === 'Character') {
      player.characters.push(playedCard);
    } else if (playedCard.cardType === 'Stage') {
      player.stages.push(playedCard);
    } else if (playedCard.cardType === 'Event') {
      // Event cards are played and go to trash
      player.trash.push(playedCard);
    }

    return gameState;
  }

  private processEndTurn(gameState: any, actionData: any) {
    // Switch to next player
    const currentPlayerId = gameState.currentPlayer;
    
    if (!gameState.players) {
      throw new Error('No players found in game state');
    }
    
    const playerIds = Object.keys(gameState.players);
    const currentIndex = playerIds.indexOf(currentPlayerId);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    
    gameState.currentPlayer = playerIds[nextIndex];
    gameState.turn = (gameState.turn || 1) + 1;
    
    // Give the next player their resources automatically
    const nextPlayer = gameState.players[gameState.currentPlayer];
    
    // Untap all cards (refresh)
    this.untapAllCards(nextPlayer);
    
    // Draw phase: draw one card (skip on first turn for first player)
    if (nextPlayer.deck.length > 0 && !(gameState.turn === 1 && nextPlayer.isFirstTurn)) {
      nextPlayer.hand.push(nextPlayer.deck.shift());
    }
    nextPlayer.isFirstTurn = false; // Mark that first turn is over
    
    // DON!! phase: place DON!! cards
    if (gameState.turn === 1 && nextPlayer.isFirstTurn) {
      // First player gets 0 additional DON!! on their first turn (already has 1)
      // No additional DON!! cards
    } else {
      // Normal turns: place 2 DON!! cards
      if (nextPlayer.donDeck.length >= 2) {
        nextPlayer.donArea.push(nextPlayer.donDeck.shift());
        nextPlayer.donArea.push(nextPlayer.donDeck.shift());
      }
    }
    
    // Go directly to main phase
    gameState.phase = 'main';
    
    return gameState;
  }

  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true },
    });
  }

  private processNextPhase(gameState: any, actionData: any) {
    const { playerId } = actionData.action;
    const player = gameState.players[playerId];
    
    if (!player) {
      throw new Error('Player not found in game state');
    }

    // Only allow manual progression from main phase to end phase
    if (gameState.phase === 'main') {
      gameState.phase = 'end';
    }
    
    if (gameState.phase === 'end') {
      // End phase: switch to next player and give them resources automatically
      this.processEndTurn(gameState, actionData);
    }

    return gameState;
  }

  private processMulligan(gameState: any, actionData: any) {
    const { playerId } = actionData.action;
    const player = gameState.players[playerId];
    
    if (!player) {
      throw new Error('Player not found in game state');
    }

    // Only allow mulligan on first turn
    if (gameState.turn !== 1 || player.hasMulliganed) {
      throw new Error('Mulligan not allowed');
    }

    // Shuffle hand back into deck
    player.deck = [...player.deck, ...player.hand];
    player.hand = [];
    
    // Shuffle deck
    player.deck = this.shuffleDeck(player.deck);
    
    // Draw 5 new cards
    for (let i = 0; i < 5 && player.deck.length > 0; i++) {
      player.hand.push(player.deck.shift());
    }
    
    player.hasMulliganed = true;
    
    return gameState;
  }

  private untapAllCards(player: any) {
    // Untap all characters and stages
    if (player.characters) {
      player.characters.forEach((card: any) => {
        card.tapped = false;
      });
    }
    if (player.stages) {
      player.stages.forEach((card: any) => {
        card.tapped = false;
      });
    }
    if (player.donArea) {
      player.donArea.forEach((don: any) => {
        don.tapped = false;
      });
    }
  }
}
