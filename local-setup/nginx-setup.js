const serviceRegistry = require('@zetwerk/zet-service-registry');
const serviceMap = serviceRegistry.SERVICE_REGISTRY;
const fs = require('fs');
const zetwerk = '/opt/homebrew/etc/nginx/servers/api.local.zetwerk.com';
const intzetwerk = '/opt/homebrew/etc/nginx/servers/api.local.intzetwerk.com';
let defPort = 6000;

async function generateNginxStr() {
    try {
        let intzetwerkStr = '', zetauthStr = `location / {
            proxy_pass http://127.0.0.1:3001;
            proxy_set_header Host $host;
            proxy_set_header hostname $host;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
        }`;
        for(let service in serviceMap) {
            let port = serviceMap[service].localPort;
            if (!port) {
                port = defPort;
                defPort++;
            }
            const str = `location ${serviceMap[service].basePath} {
                proxy_pass http://127.0.0.1:${port};
                proxy_set_header Host $host;
                proxy_set_header hostname $host;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
            }
            `;
            if (service !== 'zetauth') {
                intzetwerkStr += str;
            }
        }
        const zetAuthConfig = `server {
            listen 80;
            server_name api.local.zetwerk.com;
            proxy_pass_request_headers on;
            client_max_body_size        1024M;
            proxy_connect_timeout       1200s;
            proxy_send_timeout          1200s;
            proxy_read_timeout          1200s;
            send_timeout                300s;
            proxy_buffer_size           512k;
            proxy_buffers               32 4m;
            proxy_busy_buffers_size     25m;
            proxy_temp_file_write_size  10m;
            ${zetauthStr}
        }`;
        const intZetwerkConfig = `server {
            listen 80;
            server_name api.local.intzetwerk.com;
            proxy_pass_request_headers on;
            client_max_body_size        1024M;
            proxy_connect_timeout       1200s;
            proxy_send_timeout          1200s;
            proxy_read_timeout          1200s;
            send_timeout                300s;
            proxy_buffer_size           512k;
            proxy_buffers               32 4m;
            proxy_busy_buffers_size     25m;
            proxy_temp_file_write_size  10m;
            ${intzetwerkStr}
        }`;

        await fs.promises.writeFile(zetwerk, zetAuthConfig);
        console.log(`add api.local.zetwerk at ${zetwerk}`);
        await fs.promises.writeFile(intzetwerk, intZetwerkConfig);
        console.log(`add api.local.intzetwerk at ${intzetwerk}`);

        console.log(`If you want to change the port of your app or base path of the app then go ${intzetwerk} file and 
        change location for changing basepath and change proxy_pass for changing port`);
    } catch(err) {
        console.log(err);
    }
}

generateNginxStr().then();