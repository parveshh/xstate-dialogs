import {
  Actions,
  ActionType,
  Condition,
  EventObject,
  StateNodeConfig,
  TransitionConfigOrTarget,
} from "xstate";
import { assign } from "xstate/lib/actionTypes";
import {
  AccountContext,
  AccountEvents,
} from "./StateMachines/AccountStateMachine";

type Func<T, U> = (arg1: T, arg2: U) => Partial<T>;

/**
 *  Action for XSTATE
 */

export class ActionDef<TContext, TEvent extends EventObject> {
  #prop?: keyof TContext;
  #func?: Func<TContext, TEvent>;

  createAction<TContext,U extends keyof TContext>(prop:U, func: Func<TContext, TEvent>): void {
    this.#prop = prop;
    this.#func = func;
  }

  toJson(): Actions<TContext, TEvent> {
    if (this.#prop && this.#func) {
      const res = { [this.#prop]: this.#func };
      return res as Actions<TContext, TEvent>;
    }
    throw new Error("Action property should be defined");
  }
}
/**
 * Event for XSTATE
 */
export class EventDef<TContext, TEvent extends EventObject> {
  #cond?: Condition<TContext, TEvent>;

  constructor(
    public eventName: "*" | string,
    private target: string,
    private actions: ActionDef<TContext, TEvent> | undefined
  ) {}

  set Condition(condition: Condition<TContext, TEvent>) {
    this.#cond = condition;
  }
  toJson() {
    let res: TransitionConfigOrTarget<TContext, TEvent> = {
      target: this.target,
      actions: this.actions?.toJson(),
    };
    if (this.#cond) {
      res["cond"] = this.#cond;
    }
    return res;
  }
}

/**
 * State for XSTATE
 */

export class StateDef<TContext, TState, TEvent extends EventObject> {
  #events: Array<EventDef<TContext, TEvent>> = [];
  #type: "atomic" | "compound" | "parallel" | "final" | "history";
  #name: keyof TState;
  public constructor(
    name: keyof TState,
    type: "atomic" | "compound" | "parallel" | "final" | "history",
    events: Array<EventDef<TContext, TEvent>> | EventDef<TContext, TEvent>
  ) {
    this.#name = name;
    this.#type = type;
    this.#events = Array.isArray(events) ? events : this.#events.concat(events);
  }

  toJson(): StateNodeConfig<TContext, TState, TEvent> {
    const eventStates: TransitionConfigOrTarget<
      TContext,
      TEvent
    > = this.#events.reduce(
      (prev, current) => ({ [current.eventName]: current.toJson(), ...prev }),
      {}
    );

    return {
      [this.#name as string]: { on: { ...eventStates } },
      type: this.#type,
    };
  }
}

export class MachineDef<TContext, TState, TEvent extends EventObject> {
  #states: StateDef<TContext, TState, TEvent>[];
  constructor(private states: Array<StateDef<TContext, TState, TEvent>>) {
    this.#states = states;
  }
  toJson() {
    const res = this.#states.reduce((prev, curr) => {
      return { ...curr, ...prev };
    }, {});

    return res;
  }
}

function test() {
  const action = new ActionDef<AccountContext, AccountEvents>();
  action.createAction("answer", (ctx, evnt) => "accountOpen.answer");
}
