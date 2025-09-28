import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GamesService } from '../games/games.service';
import { MatchmakingService } from '../games/matchmaking.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private gameRooms = new Map<string, {
    players: Map<string, AuthenticatedSocket>;
    gameId: string;
    isActive: boolean;
  }>();

  constructor(
    private readonly gamesService: GamesService,
    private readonly matchmakingService: MatchmakingService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    // Set the game gateway reference in matchmaking service
    this.matchmakingService.setGameGateway(this);
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake auth or query
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      
      if (!token) {
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token as string, {
        secret: this.configService.get('JWT_SECRET'),
      });

      client.userId = payload.sub;
      
      // Fetch username from database
      const user = await this.gamesService.getUserById(payload.sub);
      client.username = user?.username || 'Unknown';

      console.log(`User ${client.username} connected to game gateway`);
    } catch (error) {
      console.error('Authentication failed:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    console.log(`User ${client.username} disconnected from game gateway`);
    
    // Remove user from all game rooms
    this.gameRooms.forEach((room, roomId) => {
      if (room.players.has(client.id)) {
        room.players.delete(client.id);
        
        // Notify other players
        this.server.to(roomId).emit('playerLeft', {
          playerId: client.id,
          username: client.username,
        });

        // Clean up empty rooms
        if (room.players.size === 0) {
          this.gameRooms.delete(roomId);
        }
      }
    });
  }

  @SubscribeMessage('joinMatchmaking')
  async handleJoinMatchmaking(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { deckId: string },
  ) {
    try {
      // Add player to matchmaking queue
      await this.matchmakingService.addToQueue(
        client.userId,
        client.username,
        data.deckId,
        client.id,
      );

      // Get queue status
      const queueStatus = await this.matchmakingService.getQueueStatus(client.userId);

      // Notify player they're in queue
      client.emit('matchmakingJoined', {
        position: queueStatus.position,
        totalPlayers: queueStatus.totalPlayers,
        estimatedWaitTime: queueStatus.estimatedWaitTime,
      });

      console.log(`${client.username} joined matchmaking queue`);
    } catch (error) {
      client.emit('error', { message: 'Failed to join matchmaking' });
      console.error('Error joining matchmaking:', error);
    }
  }

  @SubscribeMessage('leaveMatchmaking')
  async handleLeaveMatchmaking(
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      // Remove player from matchmaking queue
      await this.matchmakingService.removeFromQueue(client.userId);

      // Notify player they left queue
      client.emit('matchmakingLeft', {
        message: 'Left matchmaking queue',
      });

      console.log(`${client.username} left matchmaking queue`);
    } catch (error) {
      client.emit('error', { message: 'Failed to leave matchmaking' });
      console.error('Error leaving matchmaking:', error);
    }
  }

  @SubscribeMessage('getQueueStatus')
  async handleGetQueueStatus(
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const queueStatus = await this.matchmakingService.getQueueStatus(client.userId);
      client.emit('queueStatus', queueStatus);
    } catch (error) {
      client.emit('error', { message: 'Failed to get queue status' });
      console.error('Error getting queue status:', error);
    }
  }

  // Handle match found (called by matchmaking service)
  async handleMatchFound(game: any, player1: any, player2: any) {
    console.log(`handleMatchFound called for game ${game.id}`);
    console.log(`Player1: ${player1.username} (socketId: ${player1.socketId})`);
    console.log(`Player2: ${player2.username} (socketId: ${player2.socketId})`);
    
    try {
      // Find the socket connections for both players
      const player1Socket = this.server.sockets.sockets.get(player1.socketId);
      const player2Socket = this.server.sockets.sockets.get(player2.socketId);

      console.log(`Player1 socket found: ${!!player1Socket}`);
      console.log(`Player2 socket found: ${!!player2Socket}`);

      if (!player1Socket || !player2Socket) {
        console.error('Could not find socket connections for matched players');
        console.error(`Player1 socket: ${player1Socket ? 'found' : 'not found'}`);
        console.error(`Player2 socket: ${player2Socket ? 'found' : 'not found'}`);
        return;
      }

      // Create a room for the match
      const roomId = `match_${game.id}`;
      player1Socket.join(roomId);
      player2Socket.join(roomId);

      // Store room info
      this.gameRooms.set(roomId, {
        players: new Map([
          [player1Socket.id, player1Socket],
          [player2Socket.id, player2Socket],
        ]),
        gameId: game.id,
        isActive: false,
      });

      // Initialize game state
      const gameState = await this.gamesService.initializeGame(game.id);

      // Notify both players about the match
      this.server.to(roomId).emit('matchFound', {
        gameId: game.id,
        roomId,
        opponent: {
          id: player2.userId,
          username: player2.username,
        },
        gameState,
      });

      // Start the game immediately
      this.gameRooms.get(roomId).isActive = true;
      this.server.to(roomId).emit('gameStarted', {
        gameId: game.id,
        gameState,
        players: [
          { id: player1Socket.id, username: player1.username },
          { id: player2Socket.id, username: player2.username },
        ],
      });

      console.log(`Match started: ${player1.username} vs ${player2.username} (Game ID: ${game.id})`);
    } catch (error) {
      console.error('Error handling match found:', error);
    }
  }

  @SubscribeMessage('gameAction')
  async handleGameAction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; action: any },
  ) {
    try {
      const room = this.gameRooms.get(data.roomId);
      
      if (!room || !room.isActive) {
        client.emit('error', { message: 'Game not active' });
        return;
      }

      // Process game action
      const result = await this.gamesService.processAction(room.gameId, {
        playerId: client.userId,
        action: data.action,
      });

      // Broadcast action result to all players in room
      this.server.to(data.roomId).emit('gameUpdate', {
        action: data.action,
        result,
        gameState: result.gameState,
      });

      // Check for game end conditions
      if (result.gameState.winner) {
        this.server.to(data.roomId).emit('gameEnded', {
          winner: result.gameState.winner,
          gameState: result.gameState,
        });
        
        // Mark room as inactive
        room.isActive = false;
      }
    } catch (error) {
      client.emit('error', { message: 'Invalid game action' });
      console.error('Error processing game action:', error);
    }
  }

  @SubscribeMessage('getRoomList')
  async handleGetRoomList(@ConnectedSocket() client: AuthenticatedSocket) {
    const rooms = Array.from(this.gameRooms.entries()).map(([roomId, room]) => ({
      roomId,
      gameId: room.gameId,
      playerCount: room.players.size,
      maxPlayers: 2,
      isActive: room.isActive,
      players: Array.from(room.players.values()).map(player => ({
        username: player.username,
      })),
    }));

    client.emit('roomList', { rooms });
  }
}
