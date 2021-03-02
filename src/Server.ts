import fastify from "fastify";
import { interpret, State } from "xstate";
import detectIntent from "./services/IntentResolver";
import Responses from "./services/Replies.json";
import aMachine, {
  AccountEvents,
} from "./services/StateMachines/AccountStateMachine";

const server = fastify({ logger: true });

const store: Array<{
  conversationId: string;
  machine: any;
}> = [];

type ArrayType<T> = T extends (infer R)[] ? R : never;

server.post("/resolve", async (req, res) => {
  // lets detect intent first
  const body = req.body as { conversationId: string; ask: string };
  const { ask, conversationId } = body;

  if (!ask || !conversationId) {
    return res.status(400).send({ message: "bad request" });
  }

  const ongoing = store.find(
    (conversations) => conversations.conversationId === conversationId
  );

  const response = await detectIntent(ask);

  const machine = interpret(aMachine.machine);
  // start the machine and provide our intent
  const accountMachine = ongoing
    ? machine.start(ongoing.machine)
    : machine.start();

  const replySate = accountMachine.send(
    (response.intent as unknown) as AccountEvents
  )


  const reply = Responses[replySate.context.answer as keyof typeof Responses];
  
  //if we reached the final state, we will reply and remove this conversation
  if (replySate.done && ongoing) {
    const index = store.findIndex(
      (c) => c.conversationId === ongoing.conversationId
    );
    store.splice(index, 1);
    return res.status(200).send(reply);
  } else {
    // store this machine and id
    const currentConv: ArrayType<typeof store> = {
      conversationId,
      machine: replySate as State<any>,
    };
    if (ongoing) {
      ongoing.machine = replySate as State<any>;
    } else {
      store.push(currentConv);
    }
    return res.status(200).send(reply);
  }
});

const start = async () => {
  try {
    await server.listen(3000);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};
start();
