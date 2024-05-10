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

class ResponseBuilder {
  flags = 0;
  content = null;
  embeds = null;

  setEphemeral(): this {
    this.flags = this.flags & MessageFlags.Ephemeral;
    return this;
  }

  build(): APIInteractionResponseChannelMessageWithSource {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        flags: this.flags
      }
    }
  }
}
