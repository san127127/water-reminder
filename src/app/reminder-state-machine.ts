import { NotificationService } from './notification.service';
import { createMachine, assign } from 'xstate';
import { format } from 'date-fns';

export type Context = {
  reminderFrequencyInMinutes: number,
  nextReminderTime: number,
};

export enum EventType {
  Start = 'Start',
  Stop = 'Stop',
  Drink = 'Drink',
}

export type Event =
  | { type: EventType.Stop }
  | { type: EventType.Start, reminderFrequencyInMinutes: number }
  | { type: EventType.Drink };


export enum State {
  Stopped = 'Stopped',
  Started = 'Started',
}

export enum StartedNestedState {
  Normal = 'Normal',
  Overtime = 'Overtime',
}

enum Delay {
  Normal = 'Normal',
  Overtime = 'Overtime',
}

enum Action {
  SetReminderFrequency = 'SetReminderFrequency',
  SendNotification = 'SendNotification',
  SetNextReminderTime = 'SetNextReminderTime',
  SetNextReminderTimeOvertime = 'SetNextReminderTimeOvertime',
}

export function reminderStateMachine(notification: NotificationService) {
  const machine = createMachine<Context, Event>({
    initial: State.Stopped,
    context: {
      reminderFrequencyInMinutes: 0,
      nextReminderTime: 0,
    },
    states: {
      [State.Stopped]: {
        on: {
          [EventType.Start]: {
            actions: [Action.SetReminderFrequency],
            target: State.Started,
          },
        },
      },

      [State.Started]: {
        on: {
          [EventType.Stop]: State.Stopped,
        },
        initial: StartedNestedState.Normal,
        states: {
          [StartedNestedState.Normal]: {
            on: {
              [EventType.Drink]: StartedNestedState.Normal,
            },
            entry: [Action.SetNextReminderTime],
            after: {
              [Delay.Normal]: {
                actions: [Action.SendNotification],
                target: StartedNestedState.Overtime,
              },
            },
          },
          [StartedNestedState.Overtime]: {
            on: {
              [EventType.Drink]: StartedNestedState.Normal,
            },
            entry: [Action.SetNextReminderTimeOvertime],
            after: {
              [Delay.Overtime]: {
                actions: [Action.SendNotification],
                target: StartedNestedState.Overtime,
              },
            },
          },
        },
      },
    },
  }, {
    delays: {
      [Delay.Normal]: (ctx) => ctx.reminderFrequencyInMinutes * 60 * 1000,
      [Delay.Overtime]: 60 * 1000,
    },
    actions: {
      [Action.SetReminderFrequency]: assign((context, event) => {
        if(event.type !== EventType.Start) {
          throw new Error(`Expecting event type equals to ${EventType.Start}`);
        }

        return {
          reminderFrequencyInMinutes: event.reminderFrequencyInMinutes,
        };
      }),
      [Action.SendNotification]: () => notification.sendNotification(`[${format(new Date(), 'HH:mm aa')}] Time to drink some water!!!`),
      [Action.SetNextReminderTime]: assign({
        nextReminderTime: (context) => Date.now() + context.reminderFrequencyInMinutes * 60 * 1000,
      }),
      [Action.SetNextReminderTimeOvertime]: assign({
        // There are some issue assign context values with literal value at the moment,
        // so we must use `(ctx) => <new value>` even we don't need context here.
        // See https://github.com/statelyai/xstate/issues/3151
        nextReminderTime: (context) => Date.now() + 60 * 1000,
      }),
    },
  });

  return machine;
}
