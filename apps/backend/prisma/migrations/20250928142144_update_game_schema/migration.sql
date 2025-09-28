/*
  Warnings:

  - You are about to drop the column `timestamp` on the `game_actions` table. All the data in the column will be lost.
  - Added the required column `currentPlayerId` to the `games` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deck1Id` to the `games` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deck2Id` to the `games` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phase` to the `games` table without a default value. This is not possible if the table is not empty.
  - Added the required column `player1Id` to the `games` table without a default value. This is not possible if the table is not empty.
  - Added the required column `player2Id` to the `games` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "decks" ADD COLUMN     "leaderId" TEXT;

-- AlterTable
ALTER TABLE "game_actions" DROP COLUMN "timestamp",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "games" ADD COLUMN     "currentPlayerId" TEXT NOT NULL,
ADD COLUMN     "deck1Id" TEXT NOT NULL,
ADD COLUMN     "deck2Id" TEXT NOT NULL,
ADD COLUMN     "phase" TEXT NOT NULL,
ADD COLUMN     "player1Id" TEXT NOT NULL,
ADD COLUMN     "player2Id" TEXT NOT NULL,
ADD COLUMN     "turn" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "gameState" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "decks" ADD CONSTRAINT "decks_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_deck1Id_fkey" FOREIGN KEY ("deck1Id") REFERENCES "decks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_deck2Id_fkey" FOREIGN KEY ("deck2Id") REFERENCES "decks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
