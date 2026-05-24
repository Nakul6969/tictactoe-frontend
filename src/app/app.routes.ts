import { Routes } from '@angular/router';
import { AuthComponent } from './components/auth/auth';
import { BoardComponent } from './components/board/board';
import { LeaderboardComponent } from './components/leaderboard/leaderboard';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/auth', pathMatch: 'full' },
  { path: 'auth', component: AuthComponent },
  { path: 'game', component: BoardComponent, canActivate: [authGuard] },
  { path: 'leaderboard', component: LeaderboardComponent },
  { path: '**', redirectTo: '/auth' }
];