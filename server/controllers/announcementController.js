const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getLatestAnnouncement = async (req, res) => {
  try {
    const announcement = await prisma.announcement.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!announcement) {
      return res.json({ success: true, announcement: null });
    }

    res.json({ success: true, announcement });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
