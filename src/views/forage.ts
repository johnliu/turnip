import dedent from 'dedent';
import type { APIInteractionResponseChannelMessageWithSource } from 'discord-api-types/v10';
import { inflect } from 'inflection';

import { duration } from '@/utils/humanize';
import { randomChoice } from '@/utils/random';
import {
  DEFAULT_EMBED_COLOR,
  DEFAULT_THUMBNAIL_URL,
  ERROR_EMBED_COLOR,
  ResponseBuilder,
  SAD_THUMBNAIL_URL,
  renderUnexpectedError,
} from '@/views/base';

export function renderForage(
  userId: string,
  numForaged: number,
): APIInteractionResponseChannelMessageWithSource {
  const responses = [
    dedent`
      ### **<@${userId}> foraged ${numForaged} ${inflect('turnip', numForaged)} from the ground.**

      Are those even clean?
    `,
    dedent`
      ### **<@${userId}> found ${numForaged} ${inflect('turnip', numForaged)} in a nearby bush.**

      Lucky you!
    `,
    dedent`
      ### **${numForaged} ${inflect('turnip', numForaged)} fell from the sky onto <@${userId}>.**

      I thought turnips came from the ground..?
    `,
  ];

  return new ResponseBuilder()
    .addEmbed()
    .withColor(DEFAULT_EMBED_COLOR)
    .withThumbnail(DEFAULT_THUMBNAIL_URL)
    .withDescription(randomChoice(responses))
    .complete()
    .build();
}

export function renderForageOnCooldown(
  userId: string,
  remainingCooldown: number,
): APIInteractionResponseChannelMessageWithSource {
  return new ResponseBuilder()
    .setEphemeral()
    .addEmbed()
    .withColor(ERROR_EMBED_COLOR)
    .withThumbnail(SAD_THUMBNAIL_URL)
    .withDescription(
      dedent`
        ### You already foraged recently

        Save some for the rest of us..
      `,
    )
    .withFooter(`Try again in ${duration(remainingCooldown)}.`)
    .complete()
    .build();
}

export function renderError(): APIInteractionResponseChannelMessageWithSource {
  return renderUnexpectedError("I wasn't able to forage for you. Please try again later.");
}
