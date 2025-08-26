import { FastifyInstance } from "fastify";

export default async function routes(app: FastifyInstance) {
  app.get("/admin/test-notifications", async (req, res) => {
    try {
      // Test database connection and notification tables
      const [userPrefs, notifications, emailLogs] = await Promise.all([
        app.prisma.userNotifPref.count(),
        app.prisma.notification.count(),
        app.prisma.emailLog.count(),
      ]);

      return res.send({
        success: true,
        message: "Notification system database tables are working",
        counts: {
          userNotifPrefs: userPrefs,
          notifications: notifications,
          emailLogs: emailLogs,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return res.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  });
}
