'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EffectModal from './EffectModal';
import ComplexEffectModal from './ComplexEffectModal';

interface GameCard {
  id: string;
  name: string;
  cost: number;
  power: number;
  currentPower?: number;
  cardType: 'Leader' | 'Character' | 'Event' | 'Stage';
  color: string;
  attribute?: string;
  effectText?: string;
  imageUrl?: string;
  smallImageUrl?: string;
  tapped?: boolean;
  summoningSickness?: boolean;
  attachedDon?: number;
  effects?: any[];
}

interface GameState {
  currentPlayer: string;
  phase: 'refresh' | 'draw' | 'don' | 'main' | 'end';
  players: {
    [playerId: string]: {
      id: string;
      username: string;
      life: number;
      hand: GameCard[];
      characters: GameCard[];
      leader: GameCard;
      deck: GameCard[];
      trash: GameCard[];
      donArea: any[];
      canAttack: boolean;
    };
  };
  attackState?: {
    attackerId: string;
    targetId: string;
    attackerCardId: string;
    attackerPower: number;
    defenderPower: number;
    phase: 'defense' | 'resolved';
    responses: any[];
  };
}

interface GameBoardProps {
  gameState: GameState;
  currentPlayerId: string;
  opponentId: string;
  onPlayCard: (cardId: string) => void;
  onAttack: (cardId: string, targetId: string) => void;
  onEndTurn?: () => void;
  onActivateEffect: (cardId: string, effectId?: string) => void;
  onNextPhase?: () => void;
  onMulligan?: () => void;
  onDefend?: (type: string, cardId?: string, donUsed?: number) => void;
  onResolveAttack?: () => void;
  onAttachDon?: (targetCardId: string, donCount: number) => void;
}

export default function GameBoard({
  gameState,
  currentPlayerId,
  opponentId,
  onPlayCard,
  onAttack,
  onEndTurn,
  onActivateEffect,
  onNextPhase,
  onMulligan,
  onDefend,
  onResolveAttack,
  onAttachDon,
}: GameBoardProps) {
  const [selectedCard, setSelectedCard] = useState<GameCard | null>(null);
  const [showEffectModal, setShowEffectModal] = useState(false);
  const [showComplexEffectModal, setShowComplexEffectModal] = useState(false);
  const [complexEffectData, setComplexEffectData] = useState<any>(null);

  const currentPlayer = gameState.players[currentPlayerId];
  const opponent = gameState.players[opponentId];

  const fieldRef = useRef<HTMLDivElement>(null);
  const handRef = useRef<HTMLDivElement>(null);

  const setFieldRef = (node: HTMLDivElement | null) => {
    if (fieldRef.current !== node) {
      fieldRef.current = node;
    }
  };

  const setHandRef = (node: HTMLDivElement | null) => {
    if (handRef.current !== node) {
      handRef.current = node;
    }
  };

  const handleCardClick = (card: GameCard) => {
    setSelectedCard(card);
  };

  const handleCardDoubleClick = (card: GameCard) => {
    if (card.cardType === 'Leader') return;
    
    if (currentPlayer.hand.includes(card)) {
      onPlayCard(card.id);
    } else if (currentPlayer.characters.includes(card) && !card.tapped) {
      onAttack(card.id, opponentId);
    }
  };

  const handleActivateEffect = (effectId: string) => {
    if (selectedCard) {
      onActivateEffect(selectedCard.id, effectId);
    }
    setShowEffectModal(false);
  };

  const handleExecuteStep = (step: any, data?: any) => {
    console.log('Executing step:', step, 'with data:', data);
    // For now, just log the step execution
    // In a full implementation, this would send the step data to the backend
  };

  // Early return if game state is not ready
  if (!currentPlayer || !opponent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-straw-hat-black via-gray-900 to-straw-hat-red text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Game...</h2>
          <p className="text-gray-400">Preparing your battle!</p>
        </div>
      </div>
    );
  }

  // Debug logging
  console.log('GameBoard - Current Player ID:', currentPlayerId);
  console.log('GameBoard - Opponent ID:', opponentId);
  console.log('GameBoard - Current Player:', currentPlayer);
  console.log('GameBoard - Opponent:', opponent);
  console.log('GameBoard - Current Player Deck Length:', currentPlayer?.deck?.length);
  console.log('GameBoard - Opponent Deck Length:', opponent?.deck?.length);
  console.log('GameBoard - All Player IDs in gameState:', Object.keys(gameState.players));

  const renderCard = (card: GameCard, isInHand = false, isPlayable = true, isAttackable = false) => {
    return (
      <div
        className={`relative cursor-pointer transition-all duration-200 ${
          isInHand ? 'hover:scale-105 hover:z-10' : ''
        } ${selectedCard?.id === card.id ? 'ring-2 ring-blue-400' : ''} ${
          isAttackable ? 'ring-2 ring-red-400' : ''
        }`}
        onClick={() => handleCardClick(card)}
        onDoubleClick={() => handleCardDoubleClick(card)}
      >
        <Card className={`w-16 h-24 bg-gradient-to-br from-gray-800 to-gray-900 border-2 ${
          isPlayable ? 'border-gray-600 hover:border-blue-400' : 'border-gray-500 opacity-75'
        } ${card.tapped ? 'opacity-60' : ''} ${card.summoningSickness ? 'ring-2 ring-orange-400' : ''}`}>
          <CardContent className="p-1 h-full flex flex-col">
            {/* Card Image */}
            <div className="flex-1 bg-gray-700 rounded mb-1 flex items-center justify-center">
              {card.imageUrl ? (
                <img
                  src={card.imageUrl}
                  alt={card.name || 'Card'}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <div className="text-xs text-gray-400 text-center p-1">
                  {card.name || 'Unknown Card'}
                </div>
              )}
            </div>
            
            {/* Card Info */}
            <div className="text-xs space-y-1">
              <div className="font-bold text-white truncate text-xs" title={card.name || 'Unknown Card'}>
                {card.name || 'Unknown Card'}
              </div>
            
              {card.cardType === 'Leader' ? (
                <div className="text-center">
                  <Badge variant="secondary" className="text-xs px-1 py-0">LEADER</Badge>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-blue-400">{card.cost || '?'}</span>
                  <span className="text-red-400">
                    {card.currentPower || card.power || '?'}
                    {(card.attachedDon || 0) > 0 && (
                      <span className="text-yellow-400 text-xs">+{(card.attachedDon || 0) * 1000}</span>
                    )}
                  </span>
                </div>
              )}
              
              <div className="text-center">
                <Badge 
                  variant="outline" 
                  className={`text-xs px-1 py-0 ${
                    card.color === 'Red' ? 'border-red-500 text-red-400' :
                    card.color === 'Blue' ? 'border-blue-500 text-blue-400' :
                    card.color === 'Green' ? 'border-green-500 text-green-400' :
                    card.color === 'Purple' ? 'border-purple-500 text-purple-400' :
                    'border-yellow-500 text-yellow-400'
                  }`}
                >
                  {card.color || 'Unknown'}
                </Badge>
                {card.tapped && (
                  <div className="text-xs text-orange-400 mt-1">RESTED</div>
                )}
                {!card.tapped && card.cardType !== 'Leader' && (
                  <div className="text-xs text-green-400 mt-1">ACTIVE</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900/20 via-gray-900 to-blue-900/20 text-white relative overflow-hidden">
      {/* Game Board Container - Full Screen */}
      <div className="relative z-10 w-full h-screen flex flex-col">
        
        {/* Opponent Area (Top Half) - Flipped View */}
        <div className="h-1/2 relative bg-gradient-to-b from-red-900/30 to-transparent transform rotate-180">
          {/* Opponent Life Area (Top Left) - Flipped */}
          <div className="absolute top-4 left-4 flex flex-col items-center transform rotate-180">
            <div className="text-white font-bold text-lg mb-2">LIFE</div>
            <div className="flex flex-col gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className={`w-12 h-16 rounded border-2 ${
                  i < opponent.life ? 'bg-red-600 border-red-400' : 'bg-gray-700 border-gray-500'
                } flex items-center justify-center`}>
                  <span className="text-white font-bold text-sm">{i}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Opponent Characters Area (Top Center) - Flipped */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-3/4 h-32 bg-red-900/20 border-2 border-red-500 rounded-lg rotate-180">
            <div className="absolute top-2 left-2 text-white font-bold text-lg">CHARACTERS AREA</div>
            <div className="flex flex-wrap gap-2 p-4 pt-8">
              {(opponent.characters || []).map(card => {
                const isAttackable = card.cardType === 'Leader' || card.tapped;
                return renderCard(card, false, false, isAttackable);
              })}
            </div>
          </div>

          {/* Opponent DON!! Deck (Middle Left) - Flipped */}
          <div className="absolute top-1/2 left-8 transform -translate-y-1/2 rotate-180">
            <div className="text-white font-bold text-lg mb-2">DON!!</div>
            <div className="w-16 h-24 bg-yellow-600 border-2 border-yellow-400 rounded-lg flex items-center justify-center">
              <div className="text-white font-bold text-xs transform -rotate-90">DON!!</div>
            </div>
            <div className="text-white text-sm mt-1 text-center">
              {opponent.donArea?.filter((don: any) => !don.tapped).length || 0}
            </div>
          </div>

          {/* Opponent Leader (Middle Center) - Flipped */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-180">
            <div className="text-white font-bold text-lg mb-2">LEADER</div>
            <div className="flex justify-center">
              {opponent.leader && renderCard(opponent.leader, false, false, true)}
            </div>
          </div>

          {/* Opponent Trash (Top Right) - Flipped */}
          <div className="absolute top-6 right-6 rotate-180">
            <div className="text-white font-bold text-lg mb-2">TRASH</div>
            <div className="w-16 h-24 bg-gray-700 border-2 border-gray-500 rounded-lg flex items-center justify-center">
              <div className="text-gray-400 font-bold text-xs">TRASH</div>
            </div>
            <div className="text-white text-sm mt-1 text-center">({opponent.trash?.length || 0})</div>
          </div>

          {/* Opponent Deck (Bottom Right) - Flipped */}
          <div className="absolute bottom-8 right-8 rotate-180">
            <div className="text-white font-bold text-lg mb-2">DECK</div>
            <div className="w-16 h-24 bg-blue-600 border-2 border-blue-400 rounded-lg flex items-center justify-center">
              <div className="text-white font-bold text-xs transform -rotate-90">DECK</div>
            </div>
            <div className="text-white text-sm mt-1 text-center">({opponent.deck.length})</div>
          </div>
        </div>

        {/* End Turn Button - Middle Right Between Decks */}
        <div className="absolute top-1/2 right-8 transform -translate-y-1/2 z-50 pointer-events-auto">
          <Button 
            onClick={() => onEndTurn?.()}
            disabled={gameState.currentPlayer !== currentPlayerId || gameState.phase !== 'main'}
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 pointer-events-auto"
          >
            End Turn
          </Button>
        </div>

        {/* Player Area (Bottom Half) */}
        <div className="h-1/2 relative bg-gradient-to-t from-blue-900/30 to-transparent">
          {/* Player Characters Area (Top Center) */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-3/4 h-32 bg-blue-900/20 border-2 border-blue-500 rounded-lg">
            <div className="absolute top-2 left-2 text-white font-bold text-lg">CHARACTERS AREA</div>
            <div ref={setFieldRef} className="flex flex-wrap gap-2 p-4 pt-8">
              {(currentPlayer.characters || []).map(card => renderCard(card, false, true))}
            </div>
          </div>

          {/* Player Hand (Bottom Left) */}
          <div ref={setHandRef} className="absolute bottom-4 left-4">
            <div className="text-white font-bold text-lg mb-2">HAND</div>
            <div className="flex gap-1">
              {currentPlayer.hand.map(card => renderCard(card, true, true))}
            </div>
            <div className="text-white text-sm mt-1 text-center">({currentPlayer.hand.length})</div>
          </div>

          {/* Player DON!! Deck (Middle Left) */}
          <div className="absolute top-1/2 left-8 transform -translate-y-1/2">
            <div className="text-white font-bold text-lg mb-2">DON!!</div>
            <div className="w-16 h-24 bg-yellow-600 border-2 border-yellow-400 rounded-lg flex items-center justify-center">
              <div className="text-white font-bold text-xs transform -rotate-90">DON!!</div>
            </div>
            <div className="text-white text-sm mt-1 text-center">
              {currentPlayer.donArea?.filter((don: any) => !don.tapped).length || 0}
            </div>
          </div>

          {/* Player Leader (Middle Center) */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="text-white font-bold text-lg mb-2">LEADER</div>
            <div className="flex justify-center">
              {currentPlayer.leader && renderCard(currentPlayer.leader, false, true)}
            </div>
          </div>

          {/* Player Trash (Bottom Right) */}
          <div className="absolute bottom-6 right-6">
            <div className="text-white font-bold text-lg mb-2">TRASH</div>
            <div className="w-16 h-24 bg-gray-700 border-2 border-gray-500 rounded-lg flex items-center justify-center">
              <div className="text-gray-400 font-bold text-xs">TRASH</div>
            </div>
            <div className="text-white text-sm mt-1 text-center">({currentPlayer.trash?.length || 0})</div>
          </div>

          {/* Player Deck (Top Right) */}
          <div className="absolute top-8 right-8">
            <div className="text-white font-bold text-lg mb-2">DECK</div>
            <div className="w-16 h-24 bg-blue-600 border-2 border-blue-400 rounded-lg flex items-center justify-center">
              <div className="text-white font-bold text-xs transform -rotate-90">DECK</div>
            </div>
            <div className="text-white text-sm mt-1 text-center">({currentPlayer.deck.length})</div>
          </div>

          {/* Player Life Area (Bottom Right Corner) */}
          <div className="absolute bottom-4 right-1/4 flex flex-col items-center">
            <div className="text-white font-bold text-lg mb-2">LIFE</div>
            <div className="flex gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className={`w-12 h-16 rounded border-2 ${
                  i < currentPlayer.life ? 'bg-blue-600 border-blue-400' : 'bg-gray-700 border-gray-500'
                } flex items-center justify-center`}>
                  <span className="text-white font-bold text-sm">{i}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons (Bottom Center) */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
            <Button 
              onClick={() => selectedCard && onPlayCard(selectedCard.id)}
              disabled={
                !selectedCard || 
                gameState.currentPlayer !== currentPlayerId || 
                gameState.attackState ||
                gameState.phase !== 'main' ||
                (selectedCard.cost > 0 && (currentPlayer.donArea?.filter((don: any) => !don.tapped).length || 0) < selectedCard.cost)
              }
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Play Selected Card
              {selectedCard && selectedCard.cost > 0 && (
                <span className="ml-2 text-xs">
                  (Cost: {selectedCard.cost} DON!!)
                </span>
              )}
            </Button>
            <Button 
              onClick={() => selectedCard && onAttack(selectedCard.id, opponentId)}
              disabled={
                !selectedCard || 
                gameState.currentPlayer !== currentPlayerId || 
                !currentPlayer.canAttack || 
                gameState.attackState ||
                !currentPlayer.characters?.find(c => c.id === selectedCard.id) ||
                selectedCard.tapped
              }
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Attack with Selected
            </Button>
            <Button 
              onClick={() => {
                if (selectedCard && selectedCard.effects && selectedCard.effects.length > 0) {
                  setShowEffectModal(true);
                } else {
                  selectedCard && onActivateEffect(selectedCard.id);
                }
              }}
              disabled={!selectedCard || gameState.currentPlayer !== currentPlayerId || gameState.attackState}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Activate Effect
            </Button>
          </div>

          {/* Attack/Defense Interface */}
          {gameState.attackState && gameState.attackState.phase === 'defense' && (
            <div className="mt-8 p-6 bg-red-900/30 rounded-lg border-2 border-red-600">
              <h3 className="text-xl font-bold text-center mb-4 text-red-400">
                🛡️ DEFEND AGAINST ATTACK!
              </h3>
              <div className="text-center mb-4">
                <p className="text-white">
                  Opponent is attacking with <strong>{gameState.attackState.attackerPower}</strong> power!
                </p>
                <p className="text-gray-300 text-sm">
                  Choose your defense:
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Counter with DON!! */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-yellow-400">Counter with DON!!</h4>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      min="0" 
                      max={currentPlayer.donArea?.filter((don: any) => !don.tapped).length || 0}
                      placeholder="DON!! to use"
                      className="flex-1 p-2 rounded bg-gray-800 text-white"
                      id="donCounter"
                    />
                    <Button 
                      onClick={() => {
                        const donUsed = parseInt((document.getElementById('donCounter') as HTMLInputElement)?.value || '0');
                        onDefend?.('counter', undefined, donUsed);
                      }}
                      className="btn-secondary"
                      size="sm"
                    >
                      Counter
                    </Button>
                  </div>
                </div>
                
                {/* Use Blocker Character */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-400">Use Blocker Character</h4>
                  <Button 
                    onClick={() => selectedCard && onDefend?.('blocker', selectedCard.id)}
                    disabled={!selectedCard || !currentPlayer.characters?.find(c => c.id === selectedCard.id)}
                    className="btn-secondary w-full"
                    size="sm"
                  >
                    Block with Selected
                  </Button>
                </div>
                
                {/* Use Effect Card */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-400">Use Effect Card</h4>
                  <Button 
                    onClick={() => selectedCard && onDefend?.('effect', selectedCard.id)}
                    disabled={!selectedCard || !currentPlayer.hand?.find(c => c.id === selectedCard.id)}
                    className="btn-secondary w-full"
                    size="sm"
                  >
                    Use Effect Card
                  </Button>
                </div>
                
                {/* Use Character Effect */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-purple-400">Use Character Effect</h4>
                  <Button 
                    onClick={() => selectedCard && onDefend?.('character_effect', selectedCard.id)}
                    disabled={!selectedCard || !currentPlayer.characters?.find(c => c.id === selectedCard.id)}
                    className="btn-secondary w-full"
                    size="sm"
                  >
                    Use Character Effect
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <Button 
                  onClick={() => onResolveAttack?.()}
                  className="btn-danger"
                >
                  No Defense - Take Damage
                </Button>
              </div>
            </div>
          )}

          {/* Selected Card Info */}
          {selectedCard && (
            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
              <h3 className="text-lg font-bold mb-2">Selected Card: {selectedCard.name}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Type:</strong> {selectedCard.cardType}</p>
                  <p><strong>Cost:</strong> {selectedCard.cost}</p>
                  <p><strong>Power:</strong> {selectedCard.power}</p>
                </div>
                <div>
                  <p><strong>Color:</strong> {selectedCard.color}</p>
                  <p><strong>Attribute:</strong> {selectedCard.attribute}</p>
                  {selectedCard.effectText && (
                    <p><strong>Effect:</strong> {selectedCard.effectText}</p>
                  )}
                  {selectedCard.effects && selectedCard.effects.length > 0 && (
                    <div>
                      <p><strong>Effects:</strong></p>
                      {selectedCard.effects.map((effect, index) => (
                        <div key={index} className="text-xs mb-1 p-2 bg-gray-700 rounded">
                          <div className="font-semibold">{effect.effectType}</div>
                          <div>{effect.effectText}</div>
                          {effect.conditions && (
                            <div className="text-gray-400">({effect.conditions})</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Effect Modal */}
          {selectedCard && (
            <EffectModal
              isOpen={showEffectModal}
              onClose={() => setShowEffectModal(false)}
              cardName={selectedCard.name}
              effects={selectedCard.effects || []}
              onActivateEffect={handleActivateEffect}
            />
          )}

          {/* Complex Effect Modal */}
          {complexEffectData && (
            <ComplexEffectModal
              isOpen={showComplexEffectModal}
              onClose={() => {
                setShowComplexEffectModal(false);
                setComplexEffectData(null);
              }}
              cardName={complexEffectData.cardName}
              effectText={complexEffectData.effectText}
              steps={complexEffectData.steps}
              onExecuteStep={handleExecuteStep}
              gameState={gameState}
              currentPlayerId={currentPlayerId}
            />
          )}
        </div>
      </div>
    </div>
  );
}