import {
  assign,
  Machine,
} from "xstate";

/**
 *  account open state => account.open intent
 *  account selection state => account.selection intent
 *  business account state => account.business.intent
 *  savings account state => account.savings.intent
 *  thanks state =>  default.test
 *
 */

export type AccountContext = {
  answer?: string;
  retry?: number;
  origin?: "initial" | "accountBusiness" | "accountSavings" | "accountOpen";
};

export type AccountEvents =
  | { type: "accountOPEN" }
  | { type: "accountBUSINESS" }
  | { type: "accountSAVINGS" }
  | { type: "YES" }
  | { type: "NO" };

const emptyRetry = assign<AccountContext, AccountEvents>({
  retry: (_context: AccountContext, _event: AccountEvents) => 0,
});

//anything that starts with Dialog.account* will be passed to this machine
const AccountMachine = Machine<AccountContext, any, AccountEvents>({
  id: "accountMachine",
  initial: "initial",
  context: {},
  states: {
    initial: {
      on: {
        accountOPEN: {
          target: "accountOpen",
          actions: assign({
            answer: (_cntx) => {
              return "accountOpen.answer";
            },
            retry: (_cntx) => {
              return 0;
            },
          }),
        }, // move the state to account selection
        "*": [
          {
            target: "exit",
            cond: (context, event) => (context.retry ?? 0) >= 2,
            actions: assign({
              answer: (_) => {
                return "exit.answer";
              },
              origin: (_) => "accountOpen",
              retry: (context) => {
                return 0; // rest retry
              },
            }),
          },
          {
            target: "initial",
            actions: assign({
              answer: (_cntx) => {
                return "accountOpen.answer.retry";
              },
              retry: (context) => {
                return (context.retry ?? 0) + 1;
              },
            }),
          },
        ],
      },
    },
    accountOpen: {
      on: {
        accountBUSINESS: {
          target: "accountBusiness",
          actions: assign({
            answer: (_) => {
              return "accountBusiness.answer";
            },
            retry: (context) => {
              return 0;
            },
          }),
        },
        accountSAVINGS: {
          target: "accountSavings",
          actions: assign({
            answer: (_) => {
              return "accountSavings.answer";
            },
            retry: (context) => {
              return 0;
            },
          }),
        },
        "*": [
          {
            target: "exit",
            cond: (context, event) => (context.retry ?? 0) >= 2,
            actions: assign({
              answer: (_) => {
                return "exit.answer";
              },
              origin: (_) => "accountOpen",
              retry: (context) => {
                return 0; // rest retry
              },
            }),
          },
          {
            target: "accountOpen",
            actions: assign({
              answer: (_) => {
                return "accountOpen.answer.retry";
              },
              retry: (context) => {
                return (context.retry ?? 0) + 1;
              },
            }),
          },
        ],
      },
    },
    accountBusiness: {
      type: "final",
    },
    accountSavings: {
      type: "final",
    },

    finish: {
      type: "final",
    },
    exit: {
      on: {
        YES: {
          target: "finish",
          actions: assign((context, event) => {
            return { answer: "accountOpen.thanks" };
          }),
        },

        NO: [
          {
            target: "accountOpen",
            actions: assign({
              retry: (_cntx) => 0,
              answer: (_cntx) => "accountOpen.answer",
            }),
            cond: (context, event) => context.origin === "accountOpen",
          },
          {
            target: "accountBusiness",
            actions: assign({
              retry: (_cntx) => 0,
            }),
            cond: (context, event) => context.origin === "accountBusiness",
          },
          {
            target: "accountSavings",
            actions: assign({
              retry: (_cntx) => 0,
            }),
            cond: (context, event) => context.origin === "accountSavings",
          },
        ],
      },
    },
  },
});

export default {
  machine: AccountMachine,
  id: "accountopen",
};
