import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class FilesService {
  constructor(private configService: ConfigService) {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadCardImage(imageBuffer: Buffer, cardNumber: string) {
    try {
      const result = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${imageBuffer.toString('base64')}`,
        {
          folder: 'onepiece-tcg/cards',
          public_id: cardNumber,
          transformation: [
            { width: 400, height: 600, crop: 'fill', quality: 'auto' },
            { format: 'webp' }
          ],
        }
      );

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      throw new BadRequestException('Failed to upload image');
    }
  }

  async uploadAvatar(imageBuffer: Buffer, userId: string) {
    try {
      const result = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${imageBuffer.toString('base64')}`,
        {
          folder: 'onepiece-tcg/avatars',
          public_id: userId,
          transformation: [
            { width: 200, height: 200, crop: 'fill', quality: 'auto' },
            { format: 'webp' }
          ],
        }
      );

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      throw new BadRequestException('Failed to upload avatar');
    }
  }

  async uploadDeckBox(imageBuffer: Buffer, deckId: string) {
    try {
      const result = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${imageBuffer.toString('base64')}`,
        {
          folder: 'onepiece-tcg/deck-boxes',
          public_id: deckId,
          transformation: [
            { width: 300, height: 400, crop: 'fill', quality: 'auto' },
            { format: 'webp' }
          ],
        }
      );

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      throw new BadRequestException('Failed to upload deck box');
    }
  }

  async deleteImage(publicId: string) {
    try {
      await cloudinary.uploader.destroy(publicId);
      return { success: true };
    } catch (error) {
      throw new BadRequestException('Failed to delete image');
    }
  }

  // Fallback to external APIs if Cloudinary is not configured
  async getCardImageUrl(cardNumber: string) {
    const cloudinaryUrl = `https://res.cloudinary.com/${this.configService.get('CLOUDINARY_CLOUD_NAME')}/image/upload/onepiece-tcg/cards/${cardNumber}.webp`;
    
    // If Cloudinary is not configured, use external API
    if (!this.configService.get('CLOUDINARY_CLOUD_NAME')) {
      return `https://images.apitcg.com/${cardNumber}.jpg`;
    }
    
    return cloudinaryUrl;
  }
}
