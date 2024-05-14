import dedent from 'dedent';
import {
  type APIEmbed,
  type APIEmbedAuthor,
  type APIEmbedField,
  type APIEmbedFooter,
  type APIEmbedImage,
  type APIEmbedThumbnail,
  type APIInteractionResponseChannelMessageWithSource,
  InteractionResponseType,
  MessageFlags,
  type RESTAPIAttachment,
} from 'discord-api-types/v10';

export const DEFAULT_EMBED_COLOR = 0x7cd77e;
export const ERROR_EMBED_COLOR = 0xff4b4b;
export const DEFAULT_THUMBNAIL_URL =
  'https://cdn.discordapp.com/attachments/1239849610856628247/1239850025518108763/image.png';

export class ResponseBuilder {
  flags = 0;
  content?: string;
  embeds?: APIEmbed[];
  attachments?: RESTAPIAttachment[];

  setMessage(content: string): this {
    this.content = content;
    return this;
  }

  setAttachments(attachment: { filename: string }): this {
    this.attachments = this.attachments ?? [];
    this.attachments.push({
      id: this.attachments.length,
      filename: attachment.filename,
    });
    return this;
  }

  setEphemeral(): this {
    this.flags = this.flags | MessageFlags.Ephemeral;
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
        flags: this.flags,
        embeds: this.embeds,
        attachments: this.attachments,
      },
    };
  }
}

export class EmbedBuilder {
  title?: string;
  description?: string;
  author?: APIEmbedAuthor;
  color?: number;
  thumbnail?: APIEmbedThumbnail;
  fields?: APIEmbedField[];
  footer?: APIEmbedFooter;
  image?: APIEmbedImage;

  responseBuilder: ResponseBuilder;

  constructor(responseBuilder: ResponseBuilder) {
    this.responseBuilder = responseBuilder;
  }

  withTitle(title: string): this {
    this.title = title;
    return this;
  }

  withDescription(description: string): this {
    this.description = description;
    return this;
  }

  withAuthor(author: { name: string; icon?: string }): this {
    this.author = {
      name: author.name,
      icon_url: author.icon,
    };
    return this;
  }

  withColor(color: number): this {
    this.color = color;
    return this;
  }

  withThumbnail(url: string): this {
    this.thumbnail = {
      url: url,
    };
    return this;
  }

  withImage(url: string): this {
    this.image = {
      url,
    };
    return this;
  }

  withFooter(text: string): this {
    this.footer = {
      text: text,
    };
    return this;
  }

  addField(field: { name: string; value: string; inline?: boolean }): this {
    this.fields = this.fields ?? [];
    this.fields.push(field);
    return this;
  }

  complete(): ResponseBuilder {
    this.responseBuilder.embeds = this.responseBuilder.embeds ?? [];
    this.responseBuilder.embeds.push({
      title: this.title,
      description: this.description,
      author: this.author,
      color: this.color,
      thumbnail: this.thumbnail,
      image: this.image,
      footer: this.footer,
      fields: this.fields,
    });
    return this.responseBuilder;
  }
}

export function renderUnexpectedError(
  errorMessage: string,
): APIInteractionResponseChannelMessageWithSource {
  const message = dedent`
    **:warning: Something Went Wrong!**

    ${errorMessage}
  `;

  return new ResponseBuilder()
    .setEphemeral()
    .addEmbed()
    .withColor(ERROR_EMBED_COLOR)
    .withDescription(message)
    .complete()
    .build();
}
