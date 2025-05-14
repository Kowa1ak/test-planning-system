import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationComponent implements OnDestroy {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';

  isConfirmModalOpen = false;
  resendDisabled = false;
  countdown = 60;
  private intervalId: any;

  constructor(
    private cdr: ChangeDetectorRef // добавлено
  ) {}

  onSubmit(): void {
    this.isConfirmModalOpen = true;
    this.startCountdown();
  }

  resendEmail(): void {
    this.countdown = 60;
    this.startCountdown();
  }

  private startCountdown(): void {
    this.resendDisabled = true;
    clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      this.countdown--;
      this.cdr.markForCheck(); // обновляем шаблон
      if (this.countdown <= 0) {
        clearInterval(this.intervalId);
        this.resendDisabled = false;
        this.cdr.markForCheck();
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }
}
