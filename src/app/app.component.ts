import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { from, map, timer } from 'rxjs';
import { clearTimeout, setTimeout } from 'worker-timers';
import { interpret } from 'xstate';
import { CountdownPipe } from './countdown.pipe';
import { NotificationService } from './notification.service';
import { EventType, reminderStateMachine } from './reminder-state-machine';

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
  state = toSignal(from(this.machineService), { initialValue: this.machineService.initialState });

  countdown$ = timer(0, 1000)
    .pipe(
      map(() => this.state().context.nextReminderTime - Date.now()),
    );

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

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent) {
    if (this.state().matches('Started')) {
      event.returnValue = '';
      return false;
    }

    return true;
  }
}
