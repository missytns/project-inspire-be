/**
 * dashboard-pin controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::dashboard-pin.dashboard-pin', ({ strapi }) => ({
  async me(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('Authentication is required.');
    }

    const pins = await strapi.db.query('api::dashboard-pin.dashboard-pin').findMany({
      where: { user: { id: user.id } },
      populate: { dashboard: true },
    });
    const validPins = pins.filter((pin) => pin.dashboard);
    const stalePins = pins.filter((pin) => !pin.dashboard);

    await Promise.all(
      stalePins.map((pin) =>
        strapi.db.query('api::dashboard-pin.dashboard-pin').delete({
          where: { id: pin.id },
        })
      )
    );

    ctx.body = {
      data: validPins.map((pin) => ({
        id: pin.dashboard.id,
        documentId: pin.dashboard.documentId,
      })),
    };
  },

  async toggle(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('Authentication is required.');
    }

    const dashboardId = String(ctx.request.body?.dashboardId || '').trim();

    if (!dashboardId) {
      return ctx.badRequest('dashboardId is required.');
    }

    const dashboard = await strapi.db.query('api::power-bi-dashboard.power-bi-dashboard').findOne({
      where: /^\d+$/.test(dashboardId) ? { id: Number(dashboardId) } : { documentId: dashboardId },
    });

    if (!dashboard) {
      return ctx.notFound('Dashboard not found.');
    }

    const existingPin = await strapi.db.query('api::dashboard-pin.dashboard-pin').findOne({
      where: {
        user: { id: user.id },
        dashboard: { id: dashboard.id },
      },
    });

    if (existingPin) {
      await strapi.db.query('api::dashboard-pin.dashboard-pin').delete({
        where: { id: existingPin.id },
      });

      ctx.body = {
        data: {
          pinned: false,
          dashboardId: dashboard.documentId || dashboard.id,
        },
      };
      return;
    }

    const pins = await strapi.db.query('api::dashboard-pin.dashboard-pin').findMany({
      where: { user: { id: user.id } },
      populate: { dashboard: true },
    });
    const validPins = pins.filter((pin) => pin.dashboard);
    const stalePins = pins.filter((pin) => !pin.dashboard);

    await Promise.all(
      stalePins.map((pin) =>
        strapi.db.query('api::dashboard-pin.dashboard-pin').delete({
          where: { id: pin.id },
        })
      )
    );

    if (validPins.length >= 4) {
      return ctx.badRequest('Maximum 4 pinned dashboards allowed.');
    }

    await strapi.db.query('api::dashboard-pin.dashboard-pin').create({
      data: {
        user: user.id,
        dashboard: dashboard.id,
        publishedAt: new Date(),
      },
    });

    ctx.body = {
      data: {
        pinned: true,
        dashboardId: dashboard.documentId || dashboard.id,
      },
    };
  },
}));
