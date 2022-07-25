import { app, RelaunchOptions } from 'electron';

const isLinux = process.platform === 'linux';

export const restartApp = () => {
    const { logger } = global;

    const options: RelaunchOptions = {};

    options.args = process.argv.slice(1).concat(['--relaunch']);

    if (isLinux && process.env.APPIMAGE) {
        options.execPath = process.env.APPIMAGE;
        options.args.unshift('--appimage-extract-and-run');
    } else if (isLinux) {
        options.execPath = process.execPath;
    }
    logger.info('app', `Relaunching app with ${options.args.join(', ')} arguments.`);

    app.relaunch(options);
    app.quit();
};
