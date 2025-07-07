import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTrayDto } from './dto/create-tray.dto';
import { UpdateTrayDto } from './dto/update-tray.dto';
import { AddItemToTrayDto } from './dto/add-item-to-tray.dto';

@Injectable()
export class TraysService {
  constructor(private readonly prisma: PrismaService) {}

  async createTray(userId: string, createTrayDto: CreateTrayDto) {
    return (this.prisma as any).tray.create({
      data: {
        userId,
        ...createTrayDto,
      },
    });
  }

  async getUserTrays(userId: string) {
    return (this.prisma as any).tray.findMany({
      where: { userId },
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getTray(id: string, userId: string) {
    const tray = await (this.prisma as any).tray.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            article: {
              include: {
                source: true,
              },
            },
          },
          orderBy: { addedAt: 'desc' },
        },
      },
    });

    if (!tray) {
      throw new NotFoundException('Tray not found');
    }

    // Check access permissions
    if (tray.userId !== userId && !tray.isPublic) {
      throw new ForbiddenException('Access denied to this tray');
    }

    return tray;
  }

  async updateTray(id: string, userId: string, updateTrayDto: UpdateTrayDto) {
    const tray = await (this.prisma as any).tray.findUnique({
      where: { id },
    });

    if (!tray) {
      throw new NotFoundException('Tray not found');
    }

    if (tray.userId !== userId) {
      throw new ForbiddenException('Cannot update another user\'s tray');
    }

    return (this.prisma as any).tray.update({
      where: { id },
      data: updateTrayDto,
    });
  }

  async deleteTray(id: string, userId: string) {
    const tray = await (this.prisma as any).tray.findUnique({
      where: { id },
    });

    if (!tray) {
      throw new NotFoundException('Tray not found');
    }

    if (tray.userId !== userId) {
      throw new ForbiddenException('Cannot delete another user\'s tray');
    }

    return (this.prisma as any).tray.delete({
      where: { id },
    });
  }

  async addItemToTray(trayId: string, userId: string, addItemDto: AddItemToTrayDto) {
    const tray = await (this.prisma as any).tray.findUnique({
      where: { id: trayId },
    });

    if (!tray) {
      throw new NotFoundException('Tray not found');
    }

    if (tray.userId !== userId) {
      throw new ForbiddenException('Cannot add items to another user\'s tray');
    }

    return (this.prisma as any).trayItem.create({
      data: {
        trayId,
        ...addItemDto,
      },
    });
  }

  async removeItemFromTray(itemId: string, userId: string) {
    const item = await (this.prisma as any).trayItem.findUnique({
      where: { id: itemId },
      include: {
        tray: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    if (item.tray.userId !== userId) {
      throw new ForbiddenException('Cannot remove items from another user\'s tray');
    }

    return (this.prisma as any).trayItem.delete({
      where: { id: itemId },
    });
  }

  async getPublicTrays() {
    return (this.prisma as any).tray.findMany({
      where: { isPublic: true },
      include: {
        user: {
          select: { name: true },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getTrayStats(userId: string) {
    const [trayCount, totalItems, publicTrays] = await Promise.all([
      (this.prisma as any).tray.count({
        where: { userId },
      }),
      (this.prisma as any).trayItem.count({
        where: {
          tray: { userId },
        },
      }),
      (this.prisma as any).tray.count({
        where: { userId, isPublic: true },
      }),
    ]);

    return {
      trayCount,
      totalItems,
      publicTrays,
    };
  }
}