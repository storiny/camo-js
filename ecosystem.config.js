// noinspection SpellCheckingInspection

module.exports = {
  apps: [
    {
      args: '-r tsconfig-paths/register --transpile-only src/server.ts',
      autorestart: true,
      error: './logs/error.log',
      exec_mode: 'cluster',
      ignore_watch: ['node_modules', 'logs', 'dist'],
      instances: 2,
      max_memory_restart: '1G',
      name: 'dev',
      script: 'ts-node',
      watch: false,
    },
  ],
  deploy: {}
};
