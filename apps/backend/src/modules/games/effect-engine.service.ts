import { Injectable } from '@nestjs/common';

export interface EffectTrigger {
  type: 'onPlay' | 'onAttack' | 'onDefend' | 'onCounter' | 'onBlocker' | 'onActivate' | 'onEndTurn' | 'onStartTurn' | 'onKO' | 'onDamage' | 'onDraw' | 'onDiscard' | 'onSearch' | 'onAttachDon' | 'onDetachDon';
  condition?: (gameState: any, card: any, context: any) => boolean;
}

export interface EffectAction {
  type: 'draw' | 'search' | 'discard' | 'powerBoost' | 'heal' | 'damage' | 'counter' | 'blocker' | 'rush' | 'summoningSickness' | 'tap' | 'untap' | 'attachDon' | 'detachDon' | 'moveCard' | 'addToHand' | 'addToField' | 'addToTrash' | 'custom';
  value?: number;
  target?: 'self' | 'opponent' | 'all' | 'selected' | 'character' | 'leader' | 'hand' | 'deck' | 'trash' | 'field';
  condition?: (gameState: any, card: any, context: any) => boolean;
  customAction?: (gameState: any, card: any, context: any) => any;
}

export interface CardEffect {
  id: string;
  name: string;
  description: string;
  trigger: EffectTrigger;
  action: EffectAction;
  cost?: {
    don?: number;
    discard?: number;
    life?: number;
  };
  oncePerTurn?: boolean;
  oncePerGame?: boolean;
  used?: boolean;
}

export interface EffectContext {
  playerId: string;
  cardId: string;
  targetId?: string;
  gameState: any;
  additionalData?: any;
}

@Injectable()
export class EffectEngineService {
  private effects: Map<string, CardEffect> = new Map();
  private effectHistory: Array<{ cardId: string; effectId: string; turn: number; playerId: string }> = [];

  constructor() {
    this.initializeCommonEffects();
  }

  private initializeCommonEffects() {
    // Draw effects
    this.registerEffect({
      id: 'draw_1',
      name: 'Draw 1',
      description: 'Draw 1 card',
      trigger: { type: 'onActivate' },
      action: { type: 'draw', value: 1, target: 'self' }
    });

    this.registerEffect({
      id: 'draw_2',
      name: 'Draw 2',
      description: 'Draw 2 cards',
      trigger: { type: 'onActivate' },
      action: { type: 'draw', value: 2, target: 'self' }
    });

    // Power boost effects
    this.registerEffect({
      id: 'power_boost_1000',
      name: 'Power Boost +1000',
      description: 'This character gets +1000 power',
      trigger: { type: 'onPlay' },
      action: { type: 'powerBoost', value: 1000, target: 'self' }
    });

    this.registerEffect({
      id: 'power_boost_2000',
      name: 'Power Boost +2000',
      description: 'This character gets +2000 power',
      trigger: { type: 'onPlay' },
      action: { type: 'powerBoost', value: 2000, target: 'self' }
    });

    // Rush keyword
    this.registerEffect({
      id: 'rush',
      name: 'Rush',
      description: 'This character can attack the turn it is played',
      trigger: { type: 'onPlay' },
      action: { type: 'rush', target: 'self' }
    });

    // Counter effects
    this.registerEffect({
      id: 'counter_1000',
      name: 'Counter +1000',
      description: 'When defending, add +1000 to your counter power',
      trigger: { type: 'onCounter' },
      action: { type: 'counter', value: 1000, target: 'self' }
    });

    // Blocker effects
    this.registerEffect({
      id: 'blocker',
      name: 'Blocker',
      description: 'This character can block attacks',
      trigger: { type: 'onDefend' },
      action: { type: 'blocker', target: 'self' }
    });

    // Search effects
    this.registerEffect({
      id: 'search_character',
      name: 'Search Character',
      description: 'Search your deck for a character card',
      trigger: { type: 'onActivate' },
      action: { type: 'search', target: 'deck', value: 1 }
    });

    // Discard effects
    this.registerEffect({
      id: 'discard_1',
      name: 'Discard 1',
      description: 'Discard 1 card from your hand',
      trigger: { type: 'onActivate' },
      action: { type: 'discard', value: 1, target: 'self' }
    });

    // Heal effects
    this.registerEffect({
      id: 'heal_1',
      name: 'Heal 1',
      description: 'Heal 1 life',
      trigger: { type: 'onActivate' },
      action: { type: 'heal', value: 1, target: 'self' }
    });

    // Damage effects
    this.registerEffect({
      id: 'damage_1',
      name: 'Deal 1 Damage',
      description: 'Deal 1 damage to opponent',
      trigger: { type: 'onActivate' },
      action: { type: 'damage', value: 1, target: 'opponent' }
    });
  }

  registerEffect(effect: CardEffect) {
    this.effects.set(effect.id, effect);
  }

  getEffect(effectId: string): CardEffect | undefined {
    return this.effects.get(effectId);
  }

  canActivateEffect(effectId: string, context: EffectContext): boolean {
    const effect = this.getEffect(effectId);
    if (!effect) return false;

    // Check if effect was already used this turn/game
    if (effect.oncePerTurn && this.wasUsedThisTurn(effectId, context.playerId, context.gameState.turn)) {
      return false;
    }

    if (effect.oncePerGame && this.wasUsedThisGame(effectId, context.playerId)) {
      return false;
    }

    // Check trigger condition
    if (effect.trigger.condition && !effect.trigger.condition(context.gameState, context.cardId, context)) {
      return false;
    }

    // Check action condition
    if (effect.action.condition && !effect.action.condition(context.gameState, context.cardId, context)) {
      return false;
    }

    return true;
  }

  activateEffect(effectId: string, context: EffectContext): any {
    const effect = this.getEffect(effectId);
    if (!effect || !this.canActivateEffect(effectId, context)) {
      throw new Error(`Cannot activate effect ${effectId}`);
    }

    // Record usage
    this.effectHistory.push({
      cardId: context.cardId,
      effectId,
      turn: context.gameState.turn,
      playerId: context.playerId
    });

    // Execute the effect
    return this.executeAction(effect.action, context);
  }

  private executeAction(action: EffectAction, context: EffectContext): any {
    const { gameState, playerId, cardId, targetId } = context;
    const player = gameState.players[playerId];
    const opponent = gameState.players[Object.keys(gameState.players).find(id => id !== playerId)];

    switch (action.type) {
      case 'draw':
        return this.executeDraw(action, player, gameState);
      
      case 'search':
        return this.executeSearch(action, player, gameState);
      
      case 'discard':
        return this.executeDiscard(action, player, gameState);
      
      case 'powerBoost':
        return this.executePowerBoost(action, player, cardId, gameState);
      
      case 'heal':
        return this.executeHeal(action, player, gameState);
      
      case 'damage':
        return this.executeDamage(action, opponent, gameState);
      
      case 'counter':
        return this.executeCounter(action, player, cardId, gameState);
      
      case 'blocker':
        return this.executeBlocker(action, player, cardId, gameState);
      
      case 'rush':
        return this.executeRush(action, player, cardId, gameState);
      
      case 'tap':
        return this.executeTap(action, player, cardId, gameState);
      
      case 'untap':
        return this.executeUntap(action, player, cardId, gameState);
      
      case 'attachDon':
        return this.executeAttachDon(action, player, cardId, gameState);
      
      case 'detachDon':
        return this.executeDetachDon(action, player, cardId, gameState);
      
      case 'moveCard':
        return this.executeMoveCard(action, player, gameState);
      
      case 'custom':
        return action.customAction ? action.customAction(gameState, cardId, context) : null;
      
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private executeDraw(action: EffectAction, player: any, gameState: any) {
    const drawCount = action.value || 1;
    const drawnCards = [];
    
    console.log(`Effect: Drawing ${drawCount} cards. Deck has ${player.deck.length} cards before drawing.`);
    
    for (let i = 0; i < drawCount && player.deck.length > 0; i++) {
      drawnCards.push(player.deck.shift());
    }
    
    player.hand.push(...drawnCards);
    console.log(`Effect: Drew ${drawnCards.length} cards. Deck now has ${player.deck.length} cards.`);
    
    return { type: 'draw', cards: drawnCards, count: drawnCards.length };
  }

  private executeSearch(action: EffectAction, player: any, gameState: any) {
    // This would need to be implemented based on search criteria
    // For now, just return a placeholder
    return { type: 'search', message: 'Search effect activated' };
  }

  private executeDiscard(action: EffectAction, player: any, gameState: any) {
    const discardCount = action.value || 1;
    const discardedCards = player.hand.splice(0, discardCount);
    player.trash.push(...discardedCards);
    return { type: 'discard', cards: discardedCards, count: discardedCards.length };
  }

  private executePowerBoost(action: EffectAction, player: any, cardId: string, gameState: any) {
    const boost = action.value || 0;
    const card = this.findCardInPlay(player, cardId);
    if (card) {
      card.currentPower = (card.currentPower || card.power) + boost;
    }
    return { type: 'powerBoost', boost, cardId };
  }

  private executeHeal(action: EffectAction, player: any, gameState: any) {
    const healAmount = action.value || 1;
    player.life = Math.min(4, player.life + healAmount);
    return { type: 'heal', amount: healAmount };
  }

  private executeDamage(action: EffectAction, opponent: any, gameState: any) {
    const damageAmount = action.value || 1;
    opponent.life = Math.max(0, opponent.life - damageAmount);
    return { type: 'damage', amount: damageAmount };
  }

  private executeCounter(action: EffectAction, player: any, cardId: string, gameState: any) {
    const counterBoost = action.value || 0;
    // This would be handled during the defense phase
    return { type: 'counter', boost: counterBoost, cardId };
  }

  private executeBlocker(action: EffectAction, player: any, cardId: string, gameState: any) {
    const card = this.findCardInPlay(player, cardId);
    if (card) {
      card.canBlock = true;
    }
    return { type: 'blocker', cardId };
  }

  private executeRush(action: EffectAction, player: any, cardId: string, gameState: any) {
    const card = this.findCardInPlay(player, cardId);
    if (card) {
      card.hasRush = true;
      card.summoningSickness = false;
    }
    return { type: 'rush', cardId };
  }

  private executeTap(action: EffectAction, player: any, cardId: string, gameState: any) {
    const card = this.findCardInPlay(player, cardId);
    if (card) {
      card.tapped = true;
    }
    return { type: 'tap', cardId };
  }

  private executeUntap(action: EffectAction, player: any, cardId: string, gameState: any) {
    const card = this.findCardInPlay(player, cardId);
    if (card) {
      card.tapped = false;
    }
    return { type: 'untap', cardId };
  }

  private executeAttachDon(action: EffectAction, player: any, cardId: string, gameState: any) {
    const donCount = action.value || 1;
    const card = this.findCardInPlay(player, cardId);
    if (card) {
      card.attachedDon = (card.attachedDon || 0) + donCount;
      card.currentPower = (card.currentPower || card.power) + (donCount * 1000);
    }
    return { type: 'attachDon', donCount, cardId };
  }

  private executeDetachDon(action: EffectAction, player: any, cardId: string, gameState: any) {
    const donCount = action.value || 1;
    const card = this.findCardInPlay(player, cardId);
    if (card) {
      card.attachedDon = Math.max(0, (card.attachedDon || 0) - donCount);
      card.currentPower = (card.currentPower || card.power) - (donCount * 1000);
    }
    return { type: 'detachDon', donCount, cardId };
  }

  private executeMoveCard(action: EffectAction, player: any, gameState: any) {
    // This would handle moving cards between zones
    return { type: 'moveCard', message: 'Card moved' };
  }

  private findCardInPlay(player: any, cardId: string) {
    return [
      ...(player.characters || []),
      ...(player.stages || []),
      player.leader
    ].find(card => card && card.id === cardId);
  }

  private wasUsedThisTurn(effectId: string, playerId: string, turn: number): boolean {
    return this.effectHistory.some(record => 
      record.effectId === effectId && 
      record.playerId === playerId && 
      record.turn === turn
    );
  }

  private wasUsedThisGame(effectId: string, playerId: string): boolean {
    return this.effectHistory.some(record => 
      record.effectId === effectId && 
      record.playerId === playerId
    );
  }

  // Get all available effects for a card
  getCardEffects(cardId: string, context: EffectContext): CardEffect[] {
    const availableEffects: CardEffect[] = [];
    
    for (const effect of this.effects.values()) {
      if (this.canActivateEffect(effect.id, context)) {
        availableEffects.push(effect);
      }
    }
    
    return availableEffects;
  }

  // Clear effect history (useful for new games)
  clearHistory() {
    this.effectHistory = [];
  }
}
