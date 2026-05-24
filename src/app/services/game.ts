import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private apiUrl = 'https://tictactoe-backend-v4u0.onrender.com/api/game';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Attach JWT token to requests
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  }

  getAiMove(board: any[], size: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/ai-move`, { board, size });
  }

  saveGame(result: string, boardSize: number, moves: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/save`,
      { result, boardSize, moves },
      { headers: this.getHeaders() }
    );
  }

  getLeaderboard(): Observable<any> {
    return this.http.get(`${this.apiUrl}/leaderboard`);
  }

  getMyStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/my-stats`, {
      headers: this.getHeaders()
    });
  }
}