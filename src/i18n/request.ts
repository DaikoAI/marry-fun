import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

const namespaces = ["common", "home", "start", "chat", "goal", "help", "prologue"] as const;
type Namespace = (typeof namespaces)[number];
type MessageValue = string | number | boolean | null | MessageObject | MessageValue[];
interface MessageObject {
  [key: string]: MessageValue;
}

function isMessageObject(value: unknown): value is MessageObject {
  return typeof value === "object" && value !== null;
}

async function loadNamespaceMessages(locale: string, namespace: Namespace): Promise<MessageObject> {
  let loadedMessages: { default: unknown };

  switch (`${locale}:${namespace}`) {
    case "en:common":
      loadedMessages = (await import("../constants/messages/en/common.json")) as { default: unknown };
      break;
    case "en:home":
      loadedMessages = (await import("../constants/messages/en/home.json")) as { default: unknown };
      break;
    case "en:start":
      loadedMessages = (await import("../constants/messages/en/start.json")) as { default: unknown };
      break;
    case "en:chat":
      loadedMessages = (await import("../constants/messages/en/chat.json")) as { default: unknown };
      break;
    case "en:goal":
      loadedMessages = (await import("../constants/messages/en/goal.json")) as { default: unknown };
      break;
    case "en:help":
      loadedMessages = (await import("../constants/messages/en/help.json")) as { default: unknown };
      break;
    case "en:prologue":
      loadedMessages = (await import("../constants/messages/en/prologue.json")) as { default: unknown };
      break;
    case "ja:common":
      loadedMessages = (await import("../constants/messages/ja/common.json")) as { default: unknown };
      break;
    case "ja:home":
      loadedMessages = (await import("../constants/messages/ja/home.json")) as { default: unknown };
      break;
    case "ja:start":
      loadedMessages = (await import("../constants/messages/ja/start.json")) as { default: unknown };
      break;
    case "ja:chat":
      loadedMessages = (await import("../constants/messages/ja/chat.json")) as { default: unknown };
      break;
    case "ja:goal":
      loadedMessages = (await import("../constants/messages/ja/goal.json")) as { default: unknown };
      break;
    case "ja:help":
      loadedMessages = (await import("../constants/messages/ja/help.json")) as { default: unknown };
      break;
    case "ja:prologue":
      loadedMessages = (await import("../constants/messages/ja/prologue.json")) as { default: unknown };
      break;
    default:
      throw new Error(`Unsupported locale/namespace: ${locale}/${namespace}`);
  }

  if (!isMessageObject(loadedMessages.default)) {
    throw new Error(`Invalid message format: ${locale}/${namespace}`);
  }
  return loadedMessages.default;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const modules = await Promise.all(namespaces.map(async ns => loadNamespaceMessages(locale, ns)));
  const [common, home, start, chat, goal, help, prologue] = modules;
  const messages = { common, home, start, chat, goal, help, prologue };

  return { locale, messages };
});
