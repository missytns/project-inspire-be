export default {
  routes: [
    {
      method: 'GET',
      path: '/dashboard-pins/me',
      handler: 'dashboard-pin.me',
    },
    {
      method: 'POST',
      path: '/dashboard-pins/toggle',
      handler: 'dashboard-pin.toggle',
    },
  ],
};
