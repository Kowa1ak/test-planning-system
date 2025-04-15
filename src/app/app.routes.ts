import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component'; // импорт компонента
import { BoardComponent } from './board/board.component'; // новый импорт

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'board', component: BoardComponent },
  { path: '**', redirectTo: '' }, // маршрут для неизвестных путей
];
