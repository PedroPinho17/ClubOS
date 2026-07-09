/**
 * @module OrganizationsService
 * Perfil, branding e settings da organizacao activa; listagem/criacao (imperador).
 */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationPlan, OrganizationStatus } from '@clubos/database';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto';

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

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

  async getLogoBuffer(organizationId: string) {
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org?.logoKey) {
      throw new NotFoundException('Logotipo nao definido.');
    }
    return this.storage.getObject(org.logoKey);
  }

  /** Lista todas as organizacoes (Imperador). @deprecated Preferir GET /api/me/organizations */
  listAll() {
    return this.prisma.organization.findMany({
      select: { id: true, name: true, slug: true, plan: true, status: true, primaryColor: true },
      orderBy: { name: 'asc' },
    });
  }

  /** Cria organizacao + modulos base + memberships do criador e imperadores extra. */
  async create(dto: CreateOrganizationDto, creatorUserId: string) {
    const baseSlug = dto.slug?.trim() || slugify(dto.name);
    if (!baseSlug) {
      throw new BadRequestException('Slug invalido.');
    }

    let slug = baseSlug;
    let suffix = 0;
    while (await this.prisma.organization.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const basicModules = new Set(['dashboard', 'members', 'membership-plans', 'payments']);
    const allModules = await this.prisma.module.findMany();

    const org = await this.prisma.$transaction(async (tx) => {
      const created = await tx.organization.create({
        data: {
          name: dto.name.trim(),
          slug,
          plan: OrganizationPlan.FREE,
          status: OrganizationStatus.TRIAL,
        },
      });

      for (const module of allModules) {
        const enabled = module.isCore || basicModules.has(module.slug);
        await tx.organizationModule.create({
          data: { organizationId: created.id, moduleId: module.id, enabled },
        });
      }

      const memberIds = new Set<string>([creatorUserId, ...(dto.imperadorUserIds ?? [])]);
      for (const userId of memberIds) {
        await tx.organizationMember.create({
          data: {
            userId,
            organizationId: created.id,
            orgRole: 'imperador',
          },
        });
      }

      return created;
    });

    return this.findById(org.id);
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
