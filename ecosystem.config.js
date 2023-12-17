module.exports = {
    apps : [
        {
            name: 'zetauth-auth',
            script: './index.js', // if multiple args require, pass as array ['arg1','arg2']
            args: '--mode=auth',
            exec_mode : 'cluster', 
            node_args: '', 
            watch: false, // to prevent auto restart on any file change
            instances : '2', //number of instances in cluster
            out_file    : '/var/log/pm2/zetauth-auth.log', //log file
            error_file : '/var/log/pm2/zetauth-auth-error.log', //error log file
            merge_logs: true,
            env: {
                NODE_PATH: '.',
                NODE_ENV: 'localDevelopment',
            },
            env_production: {
                NODE_ENV: 'production',
            },
            env_staging: {
                NODE_ENV: 'staging',
            },
            env_development: {
                NODE_ENV: 'development',
            }
        },
        {
            name: 'zetauth-user',
            script: './index.js', // if multiple args require, pass as array ['arg1','arg2']
            args: '--mode=user',
            node_args: '', 
            watch: false, // to prevent auto restart on any file change
            out_file    : '/var/log/pm2/zetauth-user.log', //log file
            error_file : '/var/log/pm2/zetauth-user-error.log', //error log file
            merge_logs: true,
            env: {
                NODE_PATH: '.',
                NODE_ENV: 'localDevelopment',
            },
            env_production: {
                NODE_ENV: 'production',
            },
            env_staging: {
                NODE_ENV: 'staging',
            },
            env_development: {
                NODE_ENV: 'development',
            }
        },
        {
            name: 'zetauth-agenda',
            script: './index.js',
            args: '--mode=agenda',
            node_args: '', 
            watch: false, // to prevent auto restart on any file change
            instances: 1,
            exec_mode: 'cluster',
            out_file    : '/var/log/pm2/zetauth-agenda.log', //log file
            error_file : '/var/log/pm2/zetauth-agenda-error.log', //error log file
            merge_logs: true,
            env_localDevelopment: {
                NODE_ENV: 'localDevelopment',
            },
            env_production: {
                NODE_ENV: 'production',
            },
            env_staging: {
                NODE_ENV: 'staging',
            },
            env_development: {
                NODE_ENV: 'development',
            }
        },
        {
            name: 'zetauth-auth-local',
            script: './index.js', // if multiple args require, pass as array ['arg1','arg2']
            args: '--mode=auth',
            node_args: '',
            exec_mode : 'fork',
            instances: 1,
            watch: false, // to prevent auto restart on any file change
            out_file    : '/var/log/pm2/zetauth-user.log', //log file
            error_file : '/var/log/pm2/zetauth-user-error.log', //error log file
            merge_logs: true,
            env: {
                NODE_PATH: '.',
                NODE_ENV: 'localDevelopment'
            }
        },
        {
            name: 'zetauth-kafka',
            script: './index.js',
            args: '--mode=kafka',
            node_args: '',
            watch: false, // to prevent auto restart on any file change
            instances: 1,
            exec_mode: 'cluster',
            out_file: '/var/log/pm2/zetauth-kafka.log', //log file
            error_file: '/var/log/pm2/zetauth-kafka-error.log', //error log file
            merge_logs: true,
            env_localDevelopment: {
                NODE_ENV: 'localDevelopment'
            },
            env_production: {
                NODE_ENV: 'production'
            },
            env_staging: {
                NODE_ENV: 'staging'
            },
            env_development: {
                NODE_ENV: 'development'
            }
        }
    ]
};
  
