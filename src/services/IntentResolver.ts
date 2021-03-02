import { IntentsClient, SessionsClient } from "@google-cloud/dialogflow";
import * as uuid from "uuid";

const keyfilePath = "./key/key.json";
const projectId = "connectnow-x9b9";
const sessionClient = new SessionsClient({ keyFile: keyfilePath });

const detectIntent = async (ask: string) => {
  const sessionPath = sessionClient.projectAgentSessionPath(
    projectId,
    uuid.v4()
  );
  const result = await sessionClient.detectIntent({
    queryInput: {
      text: {
        text: ask,
        languageCode: "en-US",
      },
    },
    session: sessionPath,
  });

  let outputContext = result[0].queryResult?.outputContexts?.[0].name;
  if (outputContext) {
    outputContext = outputContext.substring(outputContext.lastIndexOf("/") + 1);
  }

  return {
    intent: result[0].queryResult?.intent?.displayName,
    context: outputContext,
  };
};

export default detectIntent;
