import { FormsModule } from '@angular/forms';
import { Component, Pipe, PipeTransform } from '@angular/core';
import { BehaviorSubject, buffer, bufferCount, filter, interval, map, Observable, of, Subscription, switchMap, takeUntil, takeWhile, timeInterval, timer } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ThisReceiver } from '@angular/compiler';

type State = 'Stopped' | 'Started' | 'StartedOvertime';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [CommonModule, FormsModule],
  standalone: true,
})
export class AppComponent {
  reminderFrequencyInMinutes = 60;
  state$ = new BehaviorSubject<State>('Stopped');
  startedCountdown$ = this.state$
    .pipe(
      filter(x => x === 'Started'),
      switchMap(() => timer(0, 1000).pipe(
        map(x => this.reminderFrequencyInMinutes * 60 - x),
        takeWhile(x => x >= 0),
        takeUntil(this.state$.pipe(filter(x => x !== 'Started')))
      ))
    );

  startedCountdownFormatted$ = this.startedCountdown$.pipe(map(x => {
    const min = `${Math.floor(x / 60)}`.padStart(2, '0');
    const sec = `${Math.floor(x % 60)}`.padStart(2, '0');
    return `${min}:${sec}`;
  }));

  overtimeCountdown$ = this.state$.pipe(
    filter(x => x === 'StartedOvertime'),
    switchMap(() => timer(0, 1000).pipe(
      map(x => 59 - (x % 60)),
      takeUntil(this.state$.pipe(filter(x => x !== 'StartedOvertime')))
    ))
  )
  constructor() {
    this.startedCountdown$.pipe(filter(x => x === 0)).subscribe(() => {
      this.sendNotification('Time to drink some water');
      this.state$.next('StartedOvertime');
    })

    this.overtimeCountdown$.pipe(filter(x => x === 0)).subscribe(() => {
      this.sendNotification('Time to drink some water');
    });
  }

  hasNotificationPermission(): boolean {
    return window.Notification.permission === 'granted';
  }

  start() {
    this.state$.next('Started');
  }

  stop() {
    this.state$.next('Stopped');
  }

  drink() {
    this.state$.next('Started');
  }

  async requestNotificationPermission() {
    const permission = await window.Notification.requestPermission();
    if(permission === 'granted') {
      this.sendNotification('We are good to go~');
    }
  }

  async sendNotification(msg: string) {
    if(window.Notification.permission === 'granted') {
      new Notification("Water reminder", {
        body: msg
      });
    }
  }
}
