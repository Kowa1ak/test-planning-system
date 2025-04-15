import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authorizedSubject = new BehaviorSubject<boolean>(false);

  // Возвращает поток, который сообщает о текущем статусе авторизации
  isAuthorized(): Observable<boolean> {
    return this.authorizedSubject.asObservable();
  }

  // Метод для авторизации пользователя (например, после успешного логина)
  login(): void {
    this.authorizedSubject.next(true);
  }

  // Метод для разавторизации пользователя
  logout(): void {
    this.authorizedSubject.next(false);
  }
}
