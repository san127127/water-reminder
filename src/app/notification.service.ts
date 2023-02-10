import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private currentNotification?: Notification;

  get currentPermission() {
    return window.Notification.permission;
  }

  async requestNotificationPermission() {
    const permission = await window.Notification.requestPermission();
    if (permission === 'granted') {
      this.sendNotification('We are good to go~');
    }
  }

  sendNotification(msg: string) {
    if (window.Notification.permission === 'granted') {
      this.currentNotification?.close();
      this.currentNotification = new Notification('Water reminder', {
        body: msg,
      });
    }
  }
}
