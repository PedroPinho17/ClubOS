import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { UpdateOrganizationDto } from './dto';

const IMAGE_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async findById(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException('Organizacao nao encontrada.');
    }
    return { ...org, logoUrl: await this.storage.getUrl(org.logoKey) };
  }

  /** Guarda o logotipo da organizacao no S3/MinIO e atualiza o logoKey. */
  async setLogo(
    organizationId: string,
    file: { buffer: Buffer; mimetype: string; size: number } | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('Ficheiro em falta.');
    }
    const ext = IMAGE_EXT[file.mimetype];
    if (!ext) {
      throw new BadRequestException('Formato invalido (usa PNG, JPG, WEBP ou SVG).');
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException('Imagem demasiado grande (max 5MB).');
    }
    const key = `${organizationId}/branding/logo-${Date.now()}.${ext}`;
    await this.storage.upload(key, file.buffer, file.mimetype);
    await this.prisma.organization.update({ where: { id: organizationId }, data: { logoKey: key } });
    return this.findById(organizationId);
  }

  update(organizationId: string, dto: UpdateOrganizationDto) {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data: dto,
    }).then(() => this.findById(organizationId));
  }

  async getSettings(organizationId: string) {
    const settings = await this.prisma.organizationSetting.findMany({
      where: { organizationId },
    });
    return Object.fromEntries(settings.map((s) => [s.key, s.value]));
  }

  async setSetting(organizationId: string, key: string, value: unknown) {
    return this.prisma.organizationSetting.upsert({
      where: { organizationId_key: { organizationId, key } },
      update: { value: value as never },
      create: { organizationId, key, value: value as never },
    });
  }
}
