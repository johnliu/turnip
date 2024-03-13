import { type APIInteractionResponsePong, InteractionResponseType } from 'discord-api-types/v10';

export function handlePing(): APIInteractionResponsePong {
  return {
    type: InteractionResponseType.Pong,
  };
}
