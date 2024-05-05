import {
  type APIInteractionResponseChannelMessageWithSource,
  InteractionResponseType,
} from 'discord-api-types/v10';

export function renderContent(content: string): APIInteractionResponseChannelMessageWithSource {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content,
    },
  };
}
