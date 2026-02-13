import { MessageService } from "@/usecase/messages";

import { D1MessageRepository } from "./repositories/d1/message-repository";

const messageRepository = new D1MessageRepository();

export const messageService = new MessageService(messageRepository);
