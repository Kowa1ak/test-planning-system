import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // добавить FormsModule
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule], // добавить FormsModule
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
  authorized = false;
  userName = '';
  settingsMenuOpen = false;

  name: string = '';
  email: string = '';
  password: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.isAuthorized().subscribe((auth) => {
      this.authorized = auth;
      this.userName =
        auth && this.authService.getUserName
          ? this.authService.getUserName()
          : '';
      this.name = this.userName;
      this.email = ''; // или получить из AuthService, если реализовано
      this.password = '';
      this.cdr.markForCheck(); // Принудительно обновляем header при любом изменении авторизации
    });
    document.addEventListener(
      'click',
      this.closeSettingsMenuOnOutsideClick.bind(this)
    );
  }

  toggleSettingsMenu() {
    this.settingsMenuOpen = !this.settingsMenuOpen;
  }

  closeSettingsMenuOnOutsideClick(event: MouseEvent) {
    if (this.settingsMenuOpen) {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu')) {
        this.settingsMenuOpen = false;
        this.cdr.markForCheck();
      }
    }
  }

  saveSettings() {
    // Здесь логика сохранения настроек пользователя
    this.settingsMenuOpen = false;
    alert('Изменения сохранены!');
  }

  goHome() {
    this.router.navigate(['/']);
  }

  goLogin() {
    this.router.navigate(['/login']);
  }

  goRegister() {
    this.router.navigate(['/registration']);
  }

  goAccount() {
    this.router.navigate(['/account']);
  }
}
