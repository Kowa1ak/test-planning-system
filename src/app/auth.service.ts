import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authorizedSubject = new BehaviorSubject<boolean>(false);
  private userName: string = '';

  // Возвращает поток, который сообщает о текущем статусе авторизации
  isAuthorized(): Observable<boolean> {
    return this.authorizedSubject.asObservable();
  }

  // Метод для авторизации пользователя (например, после успешного логина)
  login(userName: string = 'Пользователь'): void {
    this.userName = userName;
    this.authorizedSubject.next(true);
  }

  // Метод для разавторизации пользователя
  logout(): void {
    this.userName = '';
    this.authorizedSubject.next(false);
  }

  getUserName(): string {
    return this.userName;
  }
}
