import {
  type APIEmbed,
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

class ResponseBuilder {
  flags = 0;
  content?: string;
  embeds?: APIEmbed[];

  setMessage(content: string): this {
    this.content = content;
    return this;
  }

  setEphemeral(): this {
    this.flags = this.flags & MessageFlags.Ephemeral;
    return this;
  }

  addEmbed(): EmbedBuilder {
    return new EmbedBuilder(this);
  }

  build(): APIInteractionResponseChannelMessageWithSource {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: this.content,
        flags: this.flags
      }
    }
  }
}

class EmbedBuilder {
  title?: string;
  description?: string;
  color?: number;

  responseBuilder: ResponseBuilder;

  constructor(responseBuilder: ResponseBuilder) {
    this.responseBuilder = responseBuilder;
  }

  complete(): ResponseBuilder {
    if (this.responseBuilder.embeds == null) {
      this.responseBuilder.embeds = [];
    }

    this.responseBuilder.embeds.push({
      title: this.title,
      description: this.description,
    })
    return this.responseBuilder;
  }
}
