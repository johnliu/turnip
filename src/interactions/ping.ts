import { type APIInteractionResponsePong, InteractionResponseType } from 'discord-api-types';

export default function handlePing(): APIInteractionResponsePong {
  return {
    type: InteractionResponseType.Pong,
  };
}
