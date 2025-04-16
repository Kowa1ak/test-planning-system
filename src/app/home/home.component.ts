import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { MatIconModule } from '@angular/material/icon'; // добавлено

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule], // добавлено MatIconModule
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  authorized: boolean = false;
  modalOpen: boolean = false;
  boardName: string = '';
  boardDescription: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService
      .isAuthorized()
      .subscribe((auth) => (this.authorized = auth));
  }

  onLogin(): void {
    this.authService.login();
  }

  openModal(): void {
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  createBoard(): void {
    console.log('Создание доски:', this.boardName, this.boardDescription);
    this.closeModal();
    this.router.navigate(['/board']);
  }
}
