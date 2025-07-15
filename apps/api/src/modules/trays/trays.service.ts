import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTrayDto } from './dto/create-tray.dto';
import { UpdateTrayDto } from './dto/update-tray.dto';
import { AddItemToTrayDto } from './dto/add-item-to-tray.dto';
const PDFDocument = require('pdfkit');
import * as csv from 'csv-stringify/sync';

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

  // Drag & Drop Reordering
  async reorderTrayItems(
    trayId: string,
    userId: string,
    reorderInput: { itemId: string; newPosition: number }
  ) {
    const tray = await (this.prisma as any).tray.findUnique({
      where: { id: trayId },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!tray) {
      throw new NotFoundException('Tray not found');
    }

    if (tray.userId !== userId) {
      throw new ForbiddenException('Cannot reorder items in another user\'s tray');
    }

    const { itemId, newPosition } = reorderInput;
    const currentItem = tray.items.find((item: any) => item.id === itemId);
    
    if (!currentItem) {
      throw new NotFoundException('Item not found in tray');
    }

    const oldPosition = currentItem.position;

    // Use transaction to ensure atomic updates
    return await (this.prisma as any).$transaction(async (prisma: any) => {
      // Update positions of affected items
      if (oldPosition < newPosition) {
        // Moving down: decrease position of items in between
        await prisma.trayItem.updateMany({
          where: {
            trayId,
            position: {
              gt: oldPosition,
              lte: newPosition,
            },
          },
          data: {
            position: { decrement: 1 },
          },
        });
      } else if (oldPosition > newPosition) {
        // Moving up: increase position of items in between
        await prisma.trayItem.updateMany({
          where: {
            trayId,
            position: {
              gte: newPosition,
              lt: oldPosition,
            },
          },
          data: {
            position: { increment: 1 },
          },
        });
      }

      // Update the moved item's position
      return await prisma.trayItem.update({
        where: { id: itemId },
        data: { position: newPosition },
      });
    });
  }

  // Export to Markdown
  async exportToMarkdown(trayId: string, userId: string): Promise<string> {
    const tray = await this.getTray(trayId, userId);
    
    let markdown = `# ${tray.name}\n\n`;
    
    if (tray.description) {
      markdown += `${tray.description}\n\n`;
    }
    
    markdown += `*Exported from Filterie on ${new Date().toLocaleDateString()}*\n\n`;
    markdown += '---\n\n';

    for (const item of tray.items) {
      const article = item.article;
      markdown += `## ${article.title}\n\n`;
      markdown += `**Source:** [${article.source.name}](${article.url})\n`;
      markdown += `**Published:** ${new Date(article.publishedAt).toLocaleDateString()}\n`;
      markdown += `**Added:** ${new Date(item.addedAt).toLocaleDateString()}\n\n`;
      
      if (item.note) {
        markdown += `> ${item.note}\n\n`;
      }
      
      if (article.content) {
        markdown += `${article.content.substring(0, 300)}...\n\n`;
      }
      
      markdown += `[Read full article](${article.url})\n\n`;
      markdown += '---\n\n';
    }

    return markdown;
  }

  // Export to PDF
  async exportToPDF(trayId: string, userId: string): Promise<Buffer> {
    const tray = await this.getTray(trayId, userId);
    
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      // Add content
      doc.fontSize(20).text(tray.name, { align: 'center' });
      doc.moveDown();
      
      if (tray.description) {
        doc.fontSize(12).text(tray.description, { align: 'center' });
        doc.moveDown();
      }
      
      doc.fontSize(10).text(`Exported from Filterie on ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);
      
      // Add articles
      for (const item of tray.items) {
        const article = item.article;
        
        doc.fontSize(14).text(article.title);
        doc.fontSize(10).text(`Source: ${article.source.name}`);
        doc.text(`Published: ${new Date(article.publishedAt).toLocaleDateString()}`);
        doc.text(`URL: ${article.url}`, { link: article.url });
        
        if (item.note) {
          doc.moveDown();
          doc.fontSize(10).fillColor('gray').text(item.note);
          doc.fillColor('black');
        }
        
        doc.moveDown(2);
      }
      
      doc.end();
    });
  }

  // Get PDF metadata
  async getPDFMetadata(trayId: string, userId: string) {
    const tray = await this.getTray(trayId, userId);
    const user = await (this.prisma as any).user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    return {
      title: tray.name,
      author: user?.name || 'Unknown',
      subject: tray.description || undefined,
      creator: 'Filterie Export',
      creationDate: new Date(),
    };
  }

  // Export to CSV
  async exportToCSV(trayId: string, userId: string): Promise<string> {
    const tray = await this.getTray(trayId, userId);
    
    const data = tray.items.map((item: any, index: number) => ({
      Position: index + 1,
      Title: item.article.title,
      URL: item.article.url,
      Source: item.article.source.name,
      'Published Date': new Date(item.article.publishedAt).toLocaleDateString(),
      'Added Date': new Date(item.addedAt).toLocaleDateString(),
      Note: item.note || '',
    }));
    
    return csv.stringify(data, {
      header: true,
      quoted: true,
    });
  }

  // Export to HTML
  async exportToHTML(trayId: string, userId: string): Promise<string> {
    const tray = await this.getTray(trayId, userId);
    
    let html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${tray.name} - Filterie Export</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .article { margin-bottom: 30px; padding: 20px; background: #f5f5f5; border-radius: 8px; }
        .article h2 { margin-top: 0; color: #0066cc; }
        .meta { color: #666; font-size: 0.9em; }
        blockquote { margin: 10px 0; padding: 10px; background: #fff; border-left: 3px solid #0066cc; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>${tray.name}</h1>`;
    
    if (tray.description) {
      html += `\n    <p>${tray.description}</p>`;
    }
    
    html += `\n    <p><em>Exported from Filterie on ${new Date().toLocaleDateString()}</em></p>\n`;
    
    for (const item of tray.items) {
      const article = item.article;
      html += `
    <div class="article">
        <h2>${article.title}</h2>
        <div class="meta">
            <strong>Source:</strong> ${article.source.name} | 
            <strong>Published:</strong> ${new Date(article.publishedAt).toLocaleDateString()} | 
            <strong>Added:</strong> ${new Date(item.addedAt).toLocaleDateString()}
        </div>`;
      
      if (item.note) {
        html += `\n        <blockquote>${item.note}</blockquote>`;
      }
      
      html += `\n        <p><a href="${article.url}" target="_blank">Read full article →</a></p>
    </div>`;
    }
    
    html += '\n</body>\n</html>';
    
    return html;
  }

  // Export to OPML
  async exportToOPML(trayId: string, userId: string): Promise<string> {
    const tray = await this.getTray(trayId, userId);
    
    let opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
    <head>
        <title>${tray.name}</title>
        <dateCreated>${new Date().toISOString()}</dateCreated>
        <ownerName>Filterie User</ownerName>
    </head>
    <body>
        <outline text="${tray.name}" title="${tray.name}">`;
    
    for (const item of tray.items) {
      const article = item.article;
      opml += `
            <outline text="${article.title}" title="${article.title}" type="rss" xmlUrl="" htmlUrl="${article.url}"/>`;
    }
    
    opml += `
        </outline>
    </body>
</opml>`;
    
    return opml;
  }

  // Bulk operations
  async bulkAddItems(
    trayId: string,
    userId: string,
    input: { articleIds: string[] }
  ): Promise<{ added: number; skipped: number }> {
    const tray = await (this.prisma as any).tray.findUnique({
      where: { id: trayId },
    });

    if (!tray) {
      throw new NotFoundException('Tray not found');
    }

    if (tray.userId !== userId) {
      throw new ForbiddenException('Cannot add items to another user\'s tray');
    }

    // Get existing items to check for duplicates
    const existingItems = await (this.prisma as any).trayItem.findMany({
      where: { trayId },
      select: { articleId: true },
    });

    const existingArticleIds = new Set(existingItems.map((item: any) => item.articleId));
    const itemsToAdd = input.articleIds.filter(id => !existingArticleIds.has(id));
    const skipped = input.articleIds.length - itemsToAdd.length;

    if (itemsToAdd.length === 0) {
      return { added: 0, skipped };
    }

    // Get the current max position
    const maxPosition = existingItems.length;

    // Create all items in a transaction
    const createOperations = itemsToAdd.map((articleId, index) => 
      (this.prisma as any).trayItem.create({
        data: {
          trayId,
          articleId,
          position: maxPosition + index,
        },
      })
    );

    await (this.prisma as any).$transaction(createOperations);

    return { added: itemsToAdd.length, skipped };
  }

  async bulkRemoveItems(
    trayId: string,
    userId: string,
    input: { itemIds: string[] }
  ): Promise<{ removed: number }> {
    const tray = await (this.prisma as any).tray.findUnique({
      where: { id: trayId },
    });

    if (!tray) {
      throw new NotFoundException('Tray not found');
    }

    if (tray.userId !== userId) {
      throw new ForbiddenException('Cannot remove items from another user\'s tray');
    }

    const result = await (this.prisma as any).trayItem.deleteMany({
      where: {
        id: { in: input.itemIds },
        trayId,
      },
    });

    return { removed: result.count };
  }

  async duplicateTray(
    trayId: string,
    userId: string
  ): Promise<{ id: string; name: string; items: number }> {
    const originalTray = await (this.prisma as any).tray.findUnique({
      where: { id: trayId },
      include: {
        items: true,
      },
    });

    if (!originalTray) {
      throw new NotFoundException('Tray not found');
    }

    if (originalTray.userId !== userId && !originalTray.isPublic) {
      throw new ForbiddenException('Cannot duplicate this tray');
    }

    // Create new tray with items in a transaction
    const result = await (this.prisma as any).$transaction(async (prisma: any) => {
      // Create the new tray
      const newTray = await prisma.tray.create({
        data: {
          userId,
          name: `${originalTray.name} (Copy)`,
          description: originalTray.description,
          isPublic: false, // Duplicated trays start as private
        },
      });

      // Create items for the new tray
      if (originalTray.items.length > 0) {
        await prisma.trayItem.createMany({
          data: originalTray.items.map((item: any, index: number) => ({
            trayId: newTray.id,
            articleId: item.articleId,
            note: item.note,
            position: index,
          })),
        });
      }

      return { ...newTray, items: originalTray.items.length };
    });

    return {
      id: result.id,
      name: result.name,
      items: result.items,
    };
  }
}