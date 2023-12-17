const FileUploader = require('@zetwerk/zet-file-upload');
const config = require('config');
const mongooseConnection = require('../../../lib/utils/db').get();

const router = require('express').Router();

class FileRoute {
    constructor() {
        this.router = router;
        FileUploader.initialize({
            awsConfig: { s3: config.get('s3') },
            db: mongooseConnection,
            collectionName: 'files',
            basePath: 'files',
            overrideSchema: { uploadedFrom: String }
        });
        FileUploader.initializeModel();
        FileUploader.initializeRouter({
            basePath: 'files'
        });
        this.fileRouter = FileUploader.getFileRouter();
        this.loadRoutes();
    }
    loadRoutes() {
        /**
         * Loaded default routes at end because otherwise,
         * custom routes might clash with the default routes
         */
        this.router.use(this.fileRouter);
    }
}

module.exports = FileRoute;
