import { Component, NgZone, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService } from '../../services/game';
import { AuthService } from '../../services/auth';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  templateUrl: './board.html',
  styleUrl: './board.css'
})
export class BoardComponent implements OnInit {
  boardSize = 3;
  board: (string | null)[] = [];
  currentPlayer = 'X';
  gameOver = false;
  statusMessage = '';
  moveCount = 0;
  isAiThinking = false;
  scores = { X: 0, O: 0, Draw: 0 };

  // New options
  gameMode: 'ai' | 'twoPlayer' = 'ai';   // ai or twoPlayer
  difficulty: 'easy' | 'medium' | 'hard' = 'hard';

  constructor(
    private gameService: GameService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initBoard();
  }

  initBoard() {
    this.board = Array(this.boardSize * this.boardSize).fill(null);
    this.currentPlayer = 'X';
    this.gameOver = false;
    this.moveCount = 0;
    this.isAiThinking = false;
    this.statusMessage = this.gameMode === 'twoPlayer'
      ? 'Player X\'s turn'
      : 'Your turn! You are X';
  }

  changeSize() { this.initBoard(); }
  changeMode() { this.initBoard(); }
  changeDifficulty() { this.initBoard(); }

  makeMove(index: number) {
    if (this.board[index] || this.gameOver || this.isAiThinking) return;

    this.board = [...this.board];
    this.board[index] = this.currentPlayer;
    this.moveCount++;
    this.cdr.detectChanges();

    const winner = this.checkWinner();
    if (winner) { this.endGame(winner); return; }
    if (this.board.every(cell => cell !== null)) { this.endGame('draw'); return; }

    // Two player mode — just switch turns
    if (this.gameMode === 'twoPlayer') {
      this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
      this.statusMessage = `Player ${this.currentPlayer}'s turn`;
      this.cdr.detectChanges();
      return;
    }

    // AI mode
    this.currentPlayer = 'O';
    this.statusMessage = 'AI is thinking...';
    this.isAiThinking = true;
    this.cdr.detectChanges();

    // Easy: random move, Medium: 50% random, Hard: full Minimax
    if (this.difficulty === 'easy') {
      setTimeout(() => {
        this.ngZone.run(() => {
          const move = this.getRandomMove();
          this.applyAiMove(move);
        });
      }, 300);
    } else if (this.difficulty === 'medium') {
      setTimeout(() => {
        this.ngZone.run(() => {
          const useRandom = Math.random() < 0.5;
          if (useRandom) {
            this.applyAiMove(this.getRandomMove());
          } else {
            this.gameService.getAiMove([...this.board], this.boardSize).subscribe({
              next: (res) => this.ngZone.run(() => this.applyAiMove(res.move)),
              error: () => this.ngZone.run(() => this.applyAiMove(this.getRandomMove()))
            });
          }
        });
      }, 300);
    } else {
      // Hard: full Minimax via backend
      this.gameService.getAiMove([...this.board], this.boardSize).subscribe({
        next: (res) => {
          console.log('AI response:', res);
          this.ngZone.run(() => this.applyAiMove(res.move));
        },
        error: (err) => {
          console.log('AI error:', err);
          this.ngZone.run(() => {
            this.isAiThinking = false;
            this.statusMessage = 'Your turn! You are X';
            this.cdr.detectChanges();
          });
        }
      });
    }
  }

  getRandomMove(): number {
    const empty = this.board
      .map((cell, i) => cell === null ? i : -1)
      .filter(i => i !== -1);
    return empty[Math.floor(Math.random() * empty.length)];
  }

  applyAiMove(move: number) {
    this.board = [...this.board];
    this.board[move] = 'O';
    this.moveCount++;
    this.isAiThinking = false;
    this.cdr.detectChanges();

    const aiWinner = this.checkWinner();
    if (aiWinner) { this.endGame(aiWinner); return; }
    if (this.board.every(cell => cell !== null)) { this.endGame('draw'); return; }

    this.currentPlayer = 'X';
    this.statusMessage = 'Your turn! You are X';
    this.cdr.detectChanges();
  }

  checkWinner(): string | null {
    const size = this.boardSize;
    const b = this.board;
    const lines: number[][] = [];

    for (let r = 0; r < size; r++) {
      lines.push([...Array(size)].map((_, c) => r * size + c));
    }
    for (let c = 0; c < size; c++) {
      lines.push([...Array(size)].map((_, r) => r * size + c));
    }
    lines.push([...Array(size)].map((_, i) => i * size + i));
    lines.push([...Array(size)].map((_, i) => i * size + (size - 1 - i)));

    for (const line of lines) {
      const first = b[line[0]];
      if (first && line.every(idx => b[idx] === first)) return first;
    }
    return null;
  }

  endGame(winner: string) {
    this.gameOver = true;
    if (winner === 'X') {
      this.statusMessage = this.gameMode === 'twoPlayer' ? '🎉 Player X won!' : '🎉 You won!';
      this.scores['X']++;
      if (this.gameMode === 'ai') this.saveGame('win');
    } else if (winner === 'O') {
      this.statusMessage = this.gameMode === 'twoPlayer' ? '🎉 Player O won!' : '🤖 AI won!';
      this.scores['O']++;
      if (this.gameMode === 'ai') this.saveGame('loss');
    } else {
      this.statusMessage = "🤝 It's a draw!";
      this.scores['Draw']++;
      if (this.gameMode === 'ai') this.saveGame('draw');
    }
    this.cdr.detectChanges();
  }

  saveGame(result: string) {
    if (!this.authService.getToken()) return;
    this.gameService.saveGame(result, this.boardSize, this.moveCount).subscribe({
      next: () => console.log('Game saved!'),
      error: (err) => console.log('Save error:', err)
    });
  }

  getRows(): number[][] {
    const rows = [];
    for (let i = 0; i < this.boardSize; i++) {
      rows.push([...Array(this.boardSize)].map((_, j) => i * this.boardSize + j));
    }
    return rows;
  }

  getCellClass(index: number): string {
    if (!this.board[index]) return '';
    return this.board[index] === 'X' ? 'cell-x' : 'cell-o';
  }
}