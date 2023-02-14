import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'countdown',
  standalone: true,
})
export class CountdownPipe implements PipeTransform {

  transform(millisecond: unknown): string {
    if(typeof millisecond !== 'number') {
      throw new Error(`CountdownPipe expects a number value but got ${millisecond}`);
    }

    if(millisecond < 0) {
      return '00:00';
    }

    const remainingSeconds = millisecond / 1000;
    const min = `${Math.floor(remainingSeconds / 60)}`.padStart(2, '0');
    const sec = `${Math.floor(remainingSeconds % 60)}`.padStart(2, '0');
    return `${min}:${sec}`;
  }
}
