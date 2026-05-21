import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: 'public' },
    });

    if (!publicRole) return;

    const roleService = strapi.plugin('users-permissions').service('role');
    const role = await roleService.findOne(publicRole.id);

    role.permissions['api::power-bi-dashboard'] = role.permissions['api::power-bi-dashboard'] || {
      controllers: {},
    };

    role.permissions['api::power-bi-dashboard'].controllers['power-bi-dashboard'] = {
      ...(role.permissions['api::power-bi-dashboard'].controllers['power-bi-dashboard'] || {}),
      find: { enabled: false, policy: '' },
      findOne: { enabled: false, policy: '' },
    };

    await roleService.updateRole(publicRole.id, role);

    const authenticatedRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: 'authenticated' },
    });

    if (!authenticatedRole) return;

    const authenticated = await roleService.findOne(authenticatedRole.id);

    authenticated.permissions['api::power-bi-dashboard'] =
      authenticated.permissions['api::power-bi-dashboard'] || {
        controllers: {},
      };

    authenticated.permissions['api::power-bi-dashboard'].controllers['power-bi-dashboard'] = {
      ...(authenticated.permissions['api::power-bi-dashboard'].controllers['power-bi-dashboard'] || {}),
      find: { enabled: true, policy: '' },
      findOne: { enabled: true, policy: '' },
    };

    authenticated.permissions['api::dashboard-pin'] = authenticated.permissions['api::dashboard-pin'] || {
      controllers: {},
    };

    authenticated.permissions['api::dashboard-pin'].controllers['dashboard-pin'] = {
      ...(authenticated.permissions['api::dashboard-pin'].controllers['dashboard-pin'] || {}),
      me: { enabled: true, policy: '' },
      toggle: { enabled: true, policy: '' },
    };

    await roleService.updateRole(authenticatedRole.id, authenticated);
  },
};
