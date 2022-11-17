import { Injectable, ApplicationRef } from '@angular/core';
import { Observable } from 'rxjs';
import { setInterval, clearInterval } from 'worker-timers';

@Injectable({
  providedIn: 'root',
})
export class TimerService {
  constructor(private readonly appRef: ApplicationRef) {
  }

  timer() : Observable<number> {
    const obs = new Observable<number>((sub) => {
      sub.next(0);

      let counter = 1;
      const interval = setInterval(() => {
        sub.next(counter);
        counter++;
      }, 1000);

      sub.add(() => {
        clearInterval(interval);
      });
    });

    return obs;
  }
}
