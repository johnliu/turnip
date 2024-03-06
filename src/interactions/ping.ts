import { type APIInteractionResponsePong, InteractionResponseType } from 'discord-api-types/v10';

export default function handlePing(): APIInteractionResponsePong {
  return {
    type: InteractionResponseType.Pong,
  };
}
