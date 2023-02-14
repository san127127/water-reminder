import { FormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from './notification.service';
import { interpret } from 'xstate';
import { EventType, reminderStateMachine } from './reminder-state-machine';
import { setTimeout, clearTimeout } from 'worker-timers';
import { timer, map } from 'rxjs';
import { CountdownPipe } from './countdown.pipe';

interface History {
  event: 'Start' | 'Drink' | 'Stop';
  time: Date;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [CommonModule, FormsModule, CountdownPipe],
  standalone: true,
})
export class AppComponent {
  reminderFrequencyInMinutes = 60;
  histories: History[] = [];
  machineService = interpret(reminderStateMachine(this.notificationService), {
    clock: { setTimeout, clearTimeout },
  }).start();

  countdown$ = timer(0, 1000)
    .pipe(map(() => this.getCurrentState().context.nextReminderTime - Date.now()));

  constructor(
    private notificationService: NotificationService,
  ) {
  }

  hasNotificationPermission(): boolean {
    return this.notificationService.currentPermission === 'granted';
  }

  async requestNotificationPermission() {
    this.notificationService.requestNotificationPermission();
  }

  getCurrentState() {
    return this.machineService.getSnapshot();
  }

  start() {
    this.histories.push({
      event: 'Start',
      time: new Date(),
    });
    this.machineService.send({
      type: EventType.Start,
      reminderFrequencyInMinutes: this.reminderFrequencyInMinutes,
    });
  }

  stop() {
    this.histories.push({
      event: 'Stop',
      time: new Date(),
    });
    this.machineService.send({ type: EventType.Stop });
  }

  drink() {
    this.histories.push({
      event: 'Drink',
      time: new Date(),
    });
    this.machineService.send({ type: EventType.Drink });
  }
}
