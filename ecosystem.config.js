module.exports = {
  apps : [{
    name       : "bornhack-metrics",
    script     : "./src/api.start.js",
    exec_mode  : "cluster",
    watch       : true,
    instances: 0,
    env: {
      "NODE_ENV": "development",
    },
    env_production : {
       "NODE_ENV": "production"
    }
  }]
};
