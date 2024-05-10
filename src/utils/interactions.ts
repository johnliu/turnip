import {
  type APIInteractionResponseChannelMessageWithSource,
  InteractionResponseType,
  MessageFlags,
} from 'discord-api-types/v10';

import type { ExpandRecursively } from '@/utils/types';

export function renderContent(content: string): APIInteractionResponseChannelMessageWithSource {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content,
    },
  };
}

export function renderEmbed(): ExpandRecursively<APIInteractionResponseChannelMessageWithSource> {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      embeds: [
        {
          title: "Hello world",
          color:
        }
      ],
      allowed_mentions: {

      }
    }
  };
}

enum ResponseType {
  MESSAGE = 0,
  EMBEDS = 1,
}

class ResponseBuilder {
  responseType: ResponseType;

  constructor(responseType: ResponseType) {
    this.responseType = responseType;
  }

  build() {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {

      }
    }
  }
}

class MessageBuilder extends ResponseBuilder {
  message?: string;

  constructor() {
    super(ResponseType.MESSAGE);
  }

  setMessage(message: string): this {
    this.message = message;
    return this;
  }
}

class EmbedBuilder extends ResponseBuilder {
  constructor() {
    super(ResponseType.EMBEDS);
  }
}
