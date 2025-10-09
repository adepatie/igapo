#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import process from "node:process";
import chalk from "chalk";
import enquirer from "enquirer";
import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Narrator } from "./gpt/narrator.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const { Input, Select } = enquirer;

const createNarrator = () => {
  try {
    return new Narrator();
  } catch (error) {
    console.warn(
      chalk.yellow("⚠️  Falling back to offline narrator:"),
      error.message
    );
    return {
      async intro(payload) {
        const { state, availableActions } = payload;
        const actions = availableActions
          .map((action) => action.label)
          .join(", ");
        return `You push off from ${state.location}, the river alive with birdsong. Morale ${state.morale}, stamina ${state.stamina}, supplies ${state.supplies}. Available actions: ${actions}.`;
      },
      async narrateTurn({ stateSummary, encounter, action, availableActions }) {
        const actions = availableActions.map((item) => item.label).join(", ");
        const encounterLine = encounter
          ? `${encounter.title}: ${encounter.narrative}`
          : "Nothing unusual occurs.";
        return `${action.label} executed. ${encounterLine} Morale ${stateSummary.morale}, stamina ${stateSummary.stamina}, supplies ${stateSummary.supplies}. Choices ahead: ${actions}.`;
      },
    };
  }
};

const resolveJson = (toolResult) => {
  const { content = [] } = toolResult ?? {};
  const textBlock = content.find((item) => item.type === "text");
  if (!textBlock) {
    throw new Error("Tool response missing text content");
  }
  // Extract JSON from the text content - find the last complete JSON object
  const lines = textBlock.text.split("\n");
  let jsonStart = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].startsWith("{")) {
      jsonStart = i;
      break;
    }
  }
  if (jsonStart === -1) {
    throw new Error("Tool response text does not contain JSON");
  }
  const jsonText = lines.slice(jsonStart).join("\n");
  return JSON.parse(jsonText);
};

const main = async () => {
  const client = new Client({
    name: "amazon-trail-runner",
    version: "0.1.0",
  });

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(__dirname, "server", "amazonTrailServer.js")],
  });

  await client.connect(transport);

  const narrator = createNarrator();

  const playerNamePrompt = new Input({
    name: "playerName",
    message: "Expedition leader name",
    initial: "Amara",
  });

  let playerName;
  try {
    playerName = await playerNamePrompt.run();
  } catch (error) {
    // User cancelled or error occurred, use default
    playerName = "Amara";
  }

  const startResult = await client.callTool({
    name: "amazon_trail.start_game",
    arguments: { playerName },
  });
  const startPayload = resolveJson(startResult);

  console.clear();
  console.log(chalk.green.bold("Amazon Trail Expedition"));
  console.log(chalk.gray("GPT-powered interactive journey"));
  console.log();
  console.log(await narrator.intro(startPayload));
  console.log();

  let keepPlaying = true;
  let lastPayload = startPayload;

  while (keepPlaying && lastPayload.state.status === "ongoing") {
    const choices = lastPayload.availableActions.map((action) => ({
      name: action.id,
      message: `${action.label}${
        action.description ? chalk.gray(` — ${action.description}`) : ""
      }`,
      value: action.id,
    }));

    choices.push({ name: "quit", message: "Quit expedition", value: "quit" });

    const selectPrompt = new Select({
      name: "action",
      message: "Choose your next move",
      choices,
    });

    const selected = await selectPrompt.run();
    if (selected === "quit") {
      keepPlaying = false;
      break;
    }

    const actionResult = await client.callTool({
      name: "amazon_trail.perform_action",
      arguments: { actionId: selected },
    });
    const resultJson = resolveJson(actionResult);
    lastPayload = resultJson.payload;

    const narrative = await narrator.narrateTurn({
      stateSummary: lastPayload.state,
      encounter: resultJson.encounter,
      action: resultJson.action,
      availableActions: lastPayload.availableActions,
    });

    console.log();
    console.log(chalk.cyanBright(narrative));
    console.log();
  }

  if (lastPayload.state.status === "arrived") {
    console.log(chalk.green("🏁 You reached the Pará Estuary!"));
  } else if (lastPayload.state.status === "failed") {
    console.log(chalk.red("💀 The expedition could not continue."));
  } else {
    console.log(
      chalk.blue("🌅 Expedition ended early. The river awaits your return.")
    );
  }

  await client.close();
  process.exit(0);
};

main().catch((error) => {
  console.error(chalk.red("Unexpected error:"), error);
  process.exit(1);
});
