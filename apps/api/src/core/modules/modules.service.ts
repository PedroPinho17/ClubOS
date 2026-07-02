import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ModulesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lista todos os modulos do catalogo com o estado de ativacao da organizacao. */
  async listForOrganization(organizationId: string) {
    const [modules, orgModules] = await Promise.all([
      this.prisma.module.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.organizationModule.findMany({ where: { organizationId } }),
    ]);

    const enabledMap = new Map(orgModules.map((om) => [om.moduleId, om.enabled]));

    return modules.map((m) => ({
      slug: m.slug,
      name: m.name,
      description: m.description,
      category: m.category,
      isCore: m.isCore,
      sortOrder: m.sortOrder,
      enabled: m.isCore || (enabledMap.get(m.id) ?? false),
    }));
  }

  /** Slugs dos modulos ativos (core incluidos) — usado pelo frontend para navegacao. */
  async enabledSlugs(organizationId: string): Promise<string[]> {
    const modules = await this.listForOrganization(organizationId);
    return modules.filter((m) => m.enabled).map((m) => m.slug);
  }

  async setEnabled(organizationId: string, slug: string, enabled: boolean) {
    const module = await this.prisma.module.findUnique({ where: { slug } });
    if (!module) {
      throw new NotFoundException(`Modulo "${slug}" nao encontrado.`);
    }
    if (module.isCore) {
      return { slug, enabled: true, isCore: true };
    }

    const record = await this.prisma.organizationModule.upsert({
      where: { organizationId_moduleId: { organizationId, moduleId: module.id } },
      update: { enabled },
      create: { organizationId, moduleId: module.id, enabled },
    });

    return { slug, enabled: record.enabled, isCore: false };
  }
}
