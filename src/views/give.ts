import dedent from 'dedent';
import type { APIInteractionResponseChannelMessageWithSource } from 'discord-api-types/v10';

import {
  DEFAULT_EMBED_COLOR,
  DEFAULT_THUMBNAIL_URL,
  ERROR_EMBED_COLOR,
  ResponseBuilder,
  renderUnexpectedError,
} from '@/views/base';

const CLOWN_IMAGE =
  'https://cdn.discordapp.com/attachments/1239849610856628247/1239849712010530878/clown.png';

export function renderGive(senderId: string, receiverId: string) {
  return new ResponseBuilder()
    .setMessage(`||<@${receiverId}>||`)
    .addEmbed()
    .withColor(DEFAULT_EMBED_COLOR)
    .withThumbnail(DEFAULT_THUMBNAIL_URL)
    .withDescription(
      dedent`
        ### <@${senderId}> gave you a turnip <@${receiverId}>

        Lucky you!
      `,
    )
    .complete()
    .build();
}

export function renderGiveBack(
  senderId: string,
  applicationId: string,
): APIInteractionResponseChannelMessageWithSource {
  return new ResponseBuilder()
    .addEmbed()
    .withColor(ERROR_EMBED_COLOR)
    .withThumbnail(DEFAULT_THUMBNAIL_URL)
    .withDescription(
      dedent`
        ### <@${senderId}> tried to give <@${applicationId}> a turnip.

        Aww! Thanks <@${senderId}> but I can't take this turnip from you. :blush:
      `,
    )
    .complete()
    .build();
}

export function renderGiveSelf(senderId: string): APIInteractionResponseChannelMessageWithSource {
  return new ResponseBuilder()
    .addEmbed()
    .withColor(ERROR_EMBED_COLOR)
    .withThumbnail(DEFAULT_THUMBNAIL_URL)
    .withDescription(
      dedent`
        ### <@${senderId}> gave themselves a turnip.

        Nothing happened.

        :clown: :clown: :clown:
      `,
    )
    .withImage(CLOWN_IMAGE)
    .complete()
    .build();
}

export function renderNoTurnips(
  senderId: string,
  receiverId: string,
): APIInteractionResponseChannelMessageWithSource {
  return new ResponseBuilder()
    .setMessage(`||<@${receiverId}>||`)
    .addEmbed()
    .withColor(ERROR_EMBED_COLOR)
    .withThumbnail(DEFAULT_THUMBNAIL_URL)
    .withDescription(
      dedent`
        ### <@${senderId}> tried to give you a turnip <@${receiverId}>
        ..but they didn't have any turnips to give.

        Maybe you should give some turnips to <@${senderId}> instead.
      `,
    )
    .withFooter('Try foraging or harvesting for some turnips first.')
    .complete()
    .build();
}

export function renderError(): APIInteractionResponseChannelMessageWithSource {
  return renderUnexpectedError("I couldn't give your turnip away. Please try again later.");
}
