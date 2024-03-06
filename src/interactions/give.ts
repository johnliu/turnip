import {
  type APIInteractionResponseChannelMessageWithSource,
  type APIUserApplicationCommandInteraction,
  InteractionResponseType,
} from 'discord-api-types/v10';

export default function handleGive({
  data,
  member,
  user,
}: APIUserApplicationCommandInteraction): APIInteractionResponseChannelMessageWithSource {
  const senderId = member?.user.id ?? user?.id;
  const targetId = data.target_id;

  const content =
    targetId === Bun.env.APPLICATION_ID
      ? `Aw thanks <@${senderId}>, but this turnip was from me.`
      : `<@${senderId} gifted a turnip to you <@${targetId}>`;

  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content,
    },
  };
}
